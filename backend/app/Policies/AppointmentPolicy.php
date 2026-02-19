<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    /**
     * Only the patient, doctor, or clinic owner of the appointment can view it.
     */
    public function view(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->patient_id
            || $user->id === $appointment->doctor_id
            || ($user->isClinicOwner() && $user->clinic_id === $appointment->clinic_id);
    }

    /**
     * Only the patient or doctor of the appointment can update it.
     */
    public function update(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->patient_id
            || $user->id === $appointment->doctor_id;
    }

    /**
     * Only the patient, doctor, or clinic owner can delete the appointment.
     */
    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->patient_id
            || $user->id === $appointment->doctor_id
            || ($user->isClinicOwner() && $user->clinic_id === $appointment->clinic_id);
    }
}
