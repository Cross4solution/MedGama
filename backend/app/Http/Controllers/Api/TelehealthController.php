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
     * Ensure the authenticated user is the doctor or patient of this appointment.
     */
    private function authorizeParticipant($user, Appointment $appointment): void
    {
        if ($user->id !== $appointment->doctor_id && $user->id !== $appointment->patient_id) {
            abort(403, 'You are not a participant of this appointment.');
        }
    }
}
