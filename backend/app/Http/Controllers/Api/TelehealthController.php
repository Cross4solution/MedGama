<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\DailyService;
use App\Services\DeepgramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelehealthController extends Controller
{
    public function __construct(
        private DailyService $daily,
        private DeepgramService $deepgram,
    ) {}

    /**
     * Get telehealth session info for an appointment.
     * Only the doctor or patient of the appointment can access.
     */
    public function session(Request $request, string $appointmentId): JsonResponse
    {
        $appointment = Appointment::with(['doctor:id,fullname,avatar', 'patient:id,fullname,avatar'])
            ->findOrFail($appointmentId);

        $this->authorizeParticipant($request->user(), $appointment);

        // If room not yet created, create it
        if (!$appointment->meeting_id) {
            $room = $this->daily->createRoom($appointmentId);

            $appointment->update([
                'meeting_id'     => $room['meeting_id'],
                'meeting_url'    => $room['room_url'],
                'meeting_status' => 'created',
            ]);
        }

        // Generate participant token
        $roomName = 'medgama-' . \Illuminate\Support\Str::limit(\Illuminate\Support\Str::slug($appointmentId), 40, '');
        $token = $this->daily->createMeetingToken($roomName, [
            'user_name' => $request->user()->fullname ?? 'Participant',
            'is_owner'  => $request->user()->id === $appointment->doctor_id,
        ]);

        return response()->json([
            'appointment' => [
                'id'               => $appointment->id,
                'appointment_date' => $appointment->appointment_date?->toDateString(),
                'appointment_time' => $appointment->appointment_time,
                'appointment_type' => $appointment->appointment_type,
                'status'           => $appointment->status,
                'meeting_status'   => $appointment->meeting_status,
            ],
            'room' => [
                'url'   => $appointment->meeting_url,
                'token' => $token,
                'mode'  => $this->daily->isLive() ? 'production' : 'development',
            ],
            'doctor'  => $appointment->doctor,
            'patient' => $appointment->patient,
        ]);
    }

    /**
     * Get Deepgram credentials for live transcription.
     */
    public function transcriptionToken(Request $request, string $appointmentId): JsonResponse
    {
        $appointment = Appointment::findOrFail($appointmentId);
        $this->authorizeParticipant($request->user(), $appointment);

        // Transkripsiyon (Deepgram, ABD) KVKK/HIPAA gereği KAPALI — PHI'nin üçüncü taraf
        // bulutta işlenmemesi için. BAA + açık rıza sonrası TELEHEALTH_RECORDING=true ile açılır.
        // Görüşme (video/ses) bu durumdan etkilenmez; yalnızca canlı altyazı devre dışıdır.
        if (!env('TELEHEALTH_RECORDING', false)) {
            return response()->json([
                'enabled' => false,
                'mode'    => 'disabled',
                'message' => 'Transkripsiyon KVKK/HIPAA gereği devre dışı.',
            ], 200);
        }

        $keyData = $this->deepgram->createTemporaryKey(600);
        $wsUrl   = $this->deepgram->getStreamingUrl([
            'language' => $request->query('lang', 'en'),
        ]);

        return response()->json([
            'key'            => $keyData['key'],
            'mode'           => $keyData['mode'],
            'ttl'            => $keyData['ttl'],
            'websocket_url'  => $wsUrl,
        ]);
    }

    /**
     * Simulation endpoint: returns mock transcript sentences.
     */
    public function simulateTranscript(Request $request, string $appointmentId): JsonResponse
    {
        $appointment = Appointment::findOrFail($appointmentId);
        $this->authorizeParticipant($request->user(), $appointment);

        $count = min((int) $request->query('count', 1), 5);
        $sentences = $this->deepgram->simulateTranscript($count);

        return response()->json([
            'mode'    => 'simulation',
            'results' => $sentences,
        ]);
    }

    /**
     * Update meeting status (start / end session).
     */
    public function updateStatus(Request $request, string $appointmentId): JsonResponse
    {
        $request->validate([
            'meeting_status' => 'required|in:in_progress,completed,failed',
        ]);

        $appointment = Appointment::findOrFail($appointmentId);
        $this->authorizeParticipant($request->user(), $appointment);

        $appointment->update([
            'meeting_status' => $request->meeting_status,
        ]);

        // Clean up room when session completes
        if ($request->meeting_status === 'completed' && $appointment->meeting_id) {
            $roomName = 'medgama-' . \Illuminate\Support\Str::limit(\Illuminate\Support\Str::slug($appointmentId), 40, '');
            $this->daily->deleteRoom($roomName);
        }

        return response()->json([
            'meeting_status' => $appointment->meeting_status,
            'message'        => 'Meeting status updated.',
        ]);
    }

    /**
     * Self-hosted WebRTC config for a 1:1 appointment call.
     * Returns ICE servers (STUN + ephemeral TURN), the private signaling channel
     * name, this user's role, and peer info. No third-party SaaS; media is P2P
     * and E2E-encrypted (DTLS-SRTP). TURN relays only encrypted packets.
     */
    public function webrtcConfig(Request $request, string $appointmentId): JsonResponse
    {
        $appointment = Appointment::with(['doctor:id,fullname,avatar', 'patient:id,fullname,avatar'])
            ->findOrFail($appointmentId);

        $this->authorizeParticipant($request->user(), $appointment);

        $isDoctor = $request->user()->id === $appointment->doctor_id;

        return response()->json([
            'appointment' => [
                'id'             => $appointment->id,
                'status'         => $appointment->status,
                'meeting_status' => $appointment->meeting_status,
            ],
            'channel'    => 'telehealth.' . $appointment->id, // private signaling channel
            'role'       => $isDoctor ? 'doctor' : 'patient',
            'is_caller'  => $isDoctor, // doctor initiates the offer
            'self'       => $isDoctor ? $appointment->doctor : $appointment->patient,
            'peer'       => $isDoctor ? $appointment->patient : $appointment->doctor,
            'ice_servers' => $this->iceServers(),
        ]);
    }

    /**
     * Build the ICE server list: public STUN + (if configured) self-hosted coturn
     * TURN with time-limited HMAC credentials (coturn `use-auth-secret`).
     * Env: TURN_URLS (comma-separated, e.g. "turn:turn.example.com:3478,turns:turn.example.com:5349"),
     *      TURN_SECRET, TURN_TTL (seconds, default 3600), STUN_URLS (optional).
     */
    private function iceServers(): array
    {
        $stun = env('STUN_URLS', 'stun:stun.l.google.com:19302');
        $servers = [];
        foreach (array_filter(array_map('trim', explode(',', $stun))) as $url) {
            $servers[] = ['urls' => $url];
        }

        $turnUrls = array_filter(array_map('trim', explode(',', (string) env('TURN_URLS', ''))));
        $secret = env('TURN_SECRET');
        if ($turnUrls && $secret) {
            $ttl = (int) env('TURN_TTL', 3600);
            $username = (time() + $ttl) . ':medgama';
            $credential = base64_encode(hash_hmac('sha1', $username, $secret, true));
            $servers[] = [
                'urls'       => array_values($turnUrls),
                'username'   => $username,
                'credential' => $credential,
            ];
        }

        return $servers;
    }

    /**
     * Ensure the authenticated user is the doctor or patient of this appointment.
     */
    private function authorizeParticipant($user, Appointment $appointment): void
    {
        if ($user->id !== $appointment->doctor_id && $user->id !== $appointment->patient_id) {
            abort(403, 'You are not a participant of this appointment.');
        }
    }
}
