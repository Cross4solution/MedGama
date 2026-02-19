<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\User;
use App\Notifications\AppointmentBookedNotification;
use App\Notifications\AppointmentConfirmedNotification;
use App\Notifications\AppointmentCancelledNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    /**
     * List appointments scoped by the authenticated user's role.
     */
    public function list(User $user, array $filters): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->with(['patient:id,fullname,avatar,email', 'doctor:id,fullname,avatar', 'clinic:id,fullname']);

        // Scope by role
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        // Filters
        $query->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
              ->when($filters['date'] ?? null, fn($q, $v) => $q->whereDate('appointment_date', $v))
              ->when($filters['doctor_id'] ?? null, fn($q, $v) => $q->where('doctor_id', $v))
              ->when($filters['patient_id'] ?? null, fn($q, $v) => $q->where('patient_id', $v));

        return $query
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Show a single appointment with full relations.
     */
    public function find(string $id): Appointment
    {
        return Appointment::with(['patient:id,fullname,avatar,email,mobile', 'doctor:id,fullname,avatar', 'clinic:id,fullname', 'slot'])
            ->findOrFail($id);
    }

    /**
     * Create an appointment inside a DB transaction.
     *
     * Steps (all atomic):
     *  1. Resolve patient (find-or-create if doctor is booking)
     *  2. Verify & lock the calendar slot
     *  3. Create the appointment record
     *  4. Send notifications (outside transaction — fire-and-forget)
     */
    public function store(User $createdBy, array $data, bool $isCreatedByDoctor): Appointment
    {
        $appointment = DB::transaction(function () use ($createdBy, $data, $isCreatedByDoctor) {

            // 1. Resolve patient
            $patientId = $this->resolvePatientId($data, $isCreatedByDoctor);

            // 2. Build appointment payload
            $appointmentData = [
                'patient_id'        => $patientId,
                'doctor_id'         => $data['doctor_id'],
                'clinic_id'         => $data['clinic_id'] ?? null,
                'appointment_type'  => $data['appointment_type'],
                'slot_id'           => $data['slot_id'] ?? null,
                'appointment_date'  => $data['appointment_date'],
                'appointment_time'  => $data['appointment_time'],
                'confirmation_note' => $data['confirmation_note'] ?? null,
                'status'            => 'pending',
                'created_by'        => $createdBy->id,
            ];

            // 3. Lock & close the slot (inside transaction for consistency)
            if (!empty($appointmentData['slot_id'])) {
                $this->lockSlot($appointmentData['slot_id'], $data['doctor_id']);
            }

            // 4. Create appointment
            return Appointment::create($appointmentData);
        });

        // 5. Eager-load relations for response & notifications
        $appointment->load(['patient', 'doctor']);

        // 6. Notifications (outside transaction — non-critical)
        $this->sendBookedNotifications($appointment);

        return $appointment;
    }

    /**
     * Update an appointment. If status changes to cancelled, release the slot.
     */
    public function update(User $updatedBy, Appointment $appointment, array $data): Appointment
    {
        $oldStatus = $appointment->status;

        DB::transaction(function () use ($appointment, $data) {
            $appointment->update($data);

            // Release slot on cancellation
            if (($data['status'] ?? null) === 'cancelled' && $appointment->slot_id) {
                CalendarSlot::where('id', $appointment->slot_id)
                    ->update(['is_available' => true]);
            }
        });

        $appointment->refresh()->load(['patient', 'doctor']);

        // Status-change notifications (outside transaction)
        $newStatus = $data['status'] ?? null;
        if ($newStatus && $newStatus !== $oldStatus) {
            $this->sendStatusChangeNotifications($appointment, $newStatus, $updatedBy);
        }

        return $appointment;
    }

    /**
     * Soft-delete an appointment and release its slot.
     */
    public function destroy(Appointment $appointment): void
    {
        DB::transaction(function () use ($appointment) {
            if ($appointment->slot_id) {
                CalendarSlot::where('id', $appointment->slot_id)
                    ->update(['is_available' => true]);
            }

            $appointment->delete();
        });
    }

    // ── Private Helpers ──

    /**
     * Resolve patient_id: if doctor is booking and no patient_id given,
     * find-or-create a patient by email.
     */
    private function resolvePatientId(array $data, bool $isCreatedByDoctor): string
    {
        if (!$isCreatedByDoctor || !empty($data['patient_id'])) {
            return $data['patient_id'];
        }

        $patient = User::where('email', $data['patient_email'])->first();

        if (!$patient) {
            $patient = User::create([
                'email'         => $data['patient_email'],
                'fullname'      => $data['patient_name'],
                'mobile'        => $data['patient_phone'] ?? null,
                'date_of_birth' => $data['patient_dob'] ?? null,
                'role_id'       => 'patient',
                'password'      => bcrypt(\Str::random(32)),
            ]);
        }

        return $patient->id;
    }

    /**
     * Lock a calendar slot — fail if already taken or belongs to another doctor.
     *
     * @throws ValidationException
     */
    private function lockSlot(string $slotId, string $doctorId): void
    {
        $slot = CalendarSlot::active()->lockForUpdate()->findOrFail($slotId);

        if ($slot->doctor_id !== $doctorId) {
            throw ValidationException::withMessages([
                'slot_id' => ['This time slot does not belong to the selected doctor.'],
            ]);
        }

        if (!$slot->is_available) {
            throw ValidationException::withMessages([
                'slot_id' => ['This time slot is no longer available.'],
            ]);
        }

        $slot->update(['is_available' => false]);
    }

    /**
     * Send "booked" notifications to patient & doctor (fire-and-forget).
     */
    private function sendBookedNotifications(Appointment $appointment): void
    {
        try {
            $appointment->patient?->notify(
                new AppointmentBookedNotification($appointment, 'patient')
            );
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked patient notification failed: ' . $e->getMessage());
        }

        try {
            $appointment->doctor?->notify(
                new AppointmentBookedNotification($appointment, 'doctor')
            );
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked doctor notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Send notifications when appointment status changes.
     */
    private function sendStatusChangeNotifications(Appointment $appointment, string $newStatus, User $changedBy): void
    {
        $cancelledBy = $changedBy->isDoctor() ? 'doctor'
            : ($changedBy->isPatient() ? 'patient' : 'system');

        try {
            if ($newStatus === 'confirmed' && $appointment->patient) {
                $appointment->patient->notify(
                    new AppointmentConfirmedNotification($appointment)
                );
            } elseif ($newStatus === 'cancelled') {
                $appointment->patient?->notify(
                    new AppointmentCancelledNotification($appointment, 'patient', $cancelledBy)
                );
                $appointment->doctor?->notify(
                    new AppointmentCancelledNotification($appointment, 'doctor', $cancelledBy)
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Appointment status notification failed: ' . $e->getMessage());
        }
    }
}
