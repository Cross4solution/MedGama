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
        if (!config('telehealth.recording')) {
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
        // `preferred_language` da seçiliyor: alt yazı KARŞI TARAFIN diline
        // çevrilir, konuşanın diline değil. Konuşanın tarayıcısı çeviriyi
        // isterken hedef dili bilmek zorunda.
        $appointment = Appointment::with([
            'doctor:id,fullname,avatar,preferred_language',
            'patient:id,fullname,avatar,preferred_language',
        ])->findOrFail($appointmentId);

        $this->authorizeParticipant($request->user(), $appointment);

        // Yalnızca geçerli (onaylı) randevunun odası açılır. Reddedilmiş/iptal
        // edilmiş ya da henüz doktorun kabul etmediği bir randevuda görüşme
        // başlatılmamalı — bağlantı bilgisi de üretilmemeli.
        if ($appointment->status !== 'confirmed') {
            abort(403, 'This appointment is not active, so the call cannot be started.');
        }

        $isDoctor = $request->user()->id === $appointment->doctor_id;

        // Alt yazı: motor hazır mı ve kullanıcı hangi dilde görecek.
        // Arayüz bu bilgiye göre düğmeyi aktif/pasif gösterir.
        $motor = app(\App\Captions\TranscriptionEngine::class);
        $kullaniciDili = $this->altYaziDili($request->user()->preferred_language);

        return response()->json([
            'appointment' => [
                'id'             => $appointment->id,
                'status'         => $appointment->status,
                'meeting_status' => $appointment->meeting_status,
            ],
            'captions' => [
                'available'       => $motor->kullanilabilir(),
                // Dil kullanıcının profilinden gelir; görüşmede ayrıca sorulmaz.
                'language'        => $kullaniciDili,
                // Karşı tarafın onayı olmadan açılamaz: birinin sesinin
                // sunucuda işlenmesine diğeri tek başına karar veremez.
                'requires_consent' => (bool) config('captions.require_peer_consent', true),
                // Metin hiçbir yere yazılmaz; arayüz bunu kullanıcıya söyler.
                'stored'          => (bool) config('captions.store_transcripts', false),
                // Karşı tarafın dili: konuşanın satırı bu dile çevrilip gönderilir.
                'peer_language'   => $this->altYaziDili(
                    ($isDoctor ? $appointment->patient : $appointment->doctor)?->preferred_language
                ),
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
        $stun = config('telehealth.stun_urls');
        $servers = [];
        foreach (array_filter(array_map('trim', explode(',', $stun))) as $url) {
            $servers[] = ['urls' => $url];
        }

        $turnUrls = array_filter(array_map('trim', explode(',', (string) config('telehealth.turn_urls'))));
        $secret = config('telehealth.turn_secret');
        if ($turnUrls && $secret) {
            $ttl = (int) config('telehealth.turn_ttl');
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
    /**
     * GET /api/telehealth/{id}/caption-session — canlı alt yazı oturumu.
     *
     * Tarayıcı, mikrofon parçalarını buradan dönen adrese, buradan dönen
     * jetonla gönderir. Jeton RANDEVUYA bağlı ve süreli; motor `oturumAc`
     * ile üretir. Motor yoksa 409: arayüz düğmeyi zaten pasif tutuyor, bu
     * uç yalnız yarış durumunda (motor az önce düştüyse) devreye girer.
     */
    public function captionSession(Request $request, string $appointmentId): JsonResponse
    {
        $appointment = Appointment::findOrFail($appointmentId);
        $this->authorizeParticipant($request->user(), $appointment);

        if ($appointment->status !== 'confirmed') {
            abort(403, 'This appointment is not active.');
        }

        $motor = app(\App\Captions\TranscriptionEngine::class);
        if (!$motor->kullanilabilir()) {
            return response()->json(['message' => 'Alt yazı motoru şu an kullanılamıyor.'], 409);
        }

        $dil = $this->altYaziDili($request->user()->preferred_language);

        return response()->json($motor->oturumAc($appointment->id, $dil) + ['language' => $dil]);
    }

    /** Profil dili destekleniyorsa o, değilse İngilizce. */
    private function altYaziDili(?string $dil): string
    {
        $dil = strtolower(substr((string) $dil, 0, 2)) ?: 'en';
        return in_array($dil, (array) config('captions.languages', []), true) ? $dil : 'en';
    }

    private function authorizeParticipant($user, Appointment $appointment): void
    {
        if ($user->id !== $appointment->doctor_id && $user->id !== $appointment->patient_id) {
            abort(403, 'You are not a participant of this appointment.');
        }
    }
}
