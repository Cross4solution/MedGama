<?php

use App\Models\Appointment;
use App\Models\ChatConversation;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Register all of the event broadcasting channels that your application
| supports. The given channel authorization callbacks are used to check
| if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('chat.{conversationId}', function ($user, string $conversationId) {
    $conversation = ChatConversation::find($conversationId);

    return $conversation && $conversation->hasParticipant($user->id);
});

Broadcast::channel('notifications.{userId}', function ($user, string $userId) {
    return $user->id === $userId;
});

Broadcast::channel('user.{userId}', function ($user, string $userId) {
    return $user->id === $userId;
});

// Telehealth 1:1 WebRTC signaling — only the appointment's doctor or patient.
Broadcast::channel('telehealth.{appointmentId}', function ($user, string $appointmentId) {
    $appointment = Appointment::find($appointmentId);

    return $appointment
        && ($user->id === $appointment->doctor_id || $user->id === $appointment->patient_id);
});
