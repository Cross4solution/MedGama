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

/*
 * Clinic real-time channel — appointment sync and CRM.
 *
 * The channel carries AppointmentChanged for EVERY appointment in the
 * clinic: patient ids, doctor ids, dates and times. That is staff data.
 *
 * `clinic_id` alone is not enough to decide. A patient converted from a CRM
 * lead is created WITH the clinic's id (LeadController), so the old check
 * let that patient subscribe and watch the whole clinic's appointment
 * traffic. Measured: permission granted.
 *
 * So the roles are allow-listed and everything else is denied. A new role
 * gets no access until someone adds it here deliberately — the same
 * default-deny rule the appointment scopes now follow.
 */


Broadcast::channel('clinic.{clinicId}', function ($user, string $clinicId) {
    // `salesperson` is on the list on purpose: those accounts are created BY
    // the clinic (user_level 2, added_by_clinic) and the CRM calendar is their
    // workplace. Dropping them would have quietly broken their appointment sync.
    $personelRolleri = ['doctor', 'clinicOwner', 'clinic', 'hospital', 'salesperson', 'superAdmin', 'saasAdmin'];

    if (!in_array($user->role_id, $personelRolleri, true)) {
        return false;
    }

    return ($user->clinic_id !== null && $user->clinic_id === $clinicId)
        || \App\Models\Clinic::where('id', $clinicId)->where('owner_id', $user->id)->exists();
});

// Telehealth 1:1 WebRTC signaling — only the appointment's doctor or patient.
Broadcast::channel('telehealth.{appointmentId}', function ($user, string $appointmentId) {
    $appointment = Appointment::find($appointmentId);

    return $appointment
        && ($user->id === $appointment->doctor_id || $user->id === $appointment->patient_id);
});
