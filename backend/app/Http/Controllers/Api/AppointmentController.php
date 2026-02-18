<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\User;
use Illuminate\Http\Request;
use App\Notifications\AppointmentBookedNotification;
use App\Notifications\AppointmentConfirmedNotification;
use App\Notifications\AppointmentCancelledNotification;

class AppointmentController extends Controller
{
    /**
     * GET /api/appointments
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Appointment::active()->with(['patient:id,fullname,avatar,email', 'doctor:id,fullname,avatar', 'clinic:id,fullname']);

        // Scope by role
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        // Filters
        $query->when($request->status, fn($q, $v) => $q->where('status', $v))
              ->when($request->date, fn($q, $v) => $q->whereDate('appointment_date', $v))
              ->when($request->doctor_id, fn($q, $v) => $q->where('doctor_id', $v))
              ->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v));

        $appointments = $query->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($appointments);
    }

    /**
     * GET /api/appointments/{id}
     */
    public function show(Request $request, string $id)
    {
        $appointment = Appointment::active()
            ->with(['patient:id,fullname,avatar,email,mobile', 'doctor:id,fullname,avatar', 'clinic:id,fullname', 'slot'])
            ->findOrFail($id);

        return response()->json(['appointment' => $appointment]);
    }

    /**
     * POST /api/appointments
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $isDoctor = in_array($user->role_id, ['doctor', 'clinicOwner']);

        // Different validation rules for doctor vs patient
        $rules = [
            'doctor_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'appointment_type' => 'required|in:inPerson,online',
            'slot_id' => 'sometimes|uuid|exists:calendar_slots,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'confirmation_note' => 'sometimes|string|max:500',
        ];

        if ($isDoctor) {
            // Doctor creating appointment for a patient
            $rules['patient_id'] = 'sometimes|uuid|exists:users,id';
            $rules['patient_name'] = 'required|string|max:255';
            $rules['patient_email'] = 'required|email|max:255';
            $rules['patient_phone'] = 'sometimes|string|max:50';
            $rules['patient_dob'] = 'sometimes|date';
        } else {
            // Patient booking for themselves
            $rules['patient_id'] = 'required|uuid|exists:users,id';
        }

        $validated = $request->validate($rules);

        // If doctor is creating: find or create patient by email
        if ($isDoctor && empty($validated['patient_id'])) {
            $patient = User::where('email', $validated['patient_email'])->first();

            if (!$patient) {
                // Create a lightweight patient record
                $patient = User::create([
                    'email' => $validated['patient_email'],
                    'fullname' => $validated['patient_name'],
                    'mobile' => $validated['patient_phone'] ?? null,
                    'date_of_birth' => $validated['patient_dob'] ?? null,
                    'role_id' => 'patient',
                    'password' => bcrypt(\Str::random(32)), // temporary password
                ]);
            }

            $validated['patient_id'] = $patient->id;
        }

        // Remove extra fields not in appointments table
        $appointmentData = collect($validated)->only([
            'patient_id', 'doctor_id', 'clinic_id', 'appointment_type',
            'slot_id', 'appointment_date', 'appointment_time', 'confirmation_note',
        ])->toArray();

        $appointmentData['status'] = 'pending';
        $appointmentData['created_by'] = $user->id;

        // Mark slot as unavailable if provided
        if (!empty($appointmentData['slot_id'])) {
            $slot = CalendarSlot::active()->findOrFail($appointmentData['slot_id']);
            if (!$slot->is_available) {
                return response()->json(['message' => 'This time slot is no longer available.'], 422);
            }
            $slot->update(['is_available' => false]);
        }

        $appointment = Appointment::create($appointmentData);
        $appointment->load(['patient', 'doctor']);

        // Notify patient (database + mail)
        try {
            if ($appointment->patient) {
                $appointment->patient->notify(
                    new AppointmentBookedNotification($appointment, 'patient')
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked patient notification failed: ' . $e->getMessage());
        }

        // Notify doctor (database + mail)
        try {
            if ($appointment->doctor) {
                $appointment->doctor->notify(
                    new AppointmentBookedNotification($appointment, 'doctor')
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked doctor notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'appointment' => $appointment->load(['patient:id,fullname,avatar', 'doctor:id,fullname,avatar']),
        ], 201);
    }

    /**
     * PUT /api/appointments/{id}
     */
    public function update(Request $request, string $id)
    {
        $appointment = Appointment::active()->findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,cancelled,completed',
            'confirmation_note' => 'sometimes|string|max:500',
            'doctor_note' => 'sometimes|string',
            'video_conference_link' => 'sometimes|string|url',
        ]);

        $oldStatus = $appointment->status;
        $appointment->update($validated);
        $appointment->load(['patient', 'doctor']);

        // If cancelled, release the slot
        if (isset($validated['status']) && $validated['status'] === 'cancelled' && $appointment->slot_id) {
            CalendarSlot::where('id', $appointment->slot_id)->update(['is_available' => true]);
        }

        // Send notifications on status change
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $cancelledBy = $request->user()?->isDoctor() ? 'doctor' : ($request->user()?->isPatient() ? 'patient' : 'system');

            try {
                if ($validated['status'] === 'confirmed') {
                    // Notify patient that appointment is confirmed
                    if ($appointment->patient) {
                        $appointment->patient->notify(
                            new AppointmentConfirmedNotification($appointment)
                        );
                    }
                } elseif ($validated['status'] === 'cancelled') {
                    // Notify patient
                    if ($appointment->patient) {
                        $appointment->patient->notify(
                            new AppointmentCancelledNotification($appointment, 'patient', $cancelledBy)
                        );
                    }
                    // Notify doctor
                    if ($appointment->doctor) {
                        $appointment->doctor->notify(
                            new AppointmentCancelledNotification($appointment, 'doctor', $cancelledBy)
                        );
                    }
                }
            } catch (\Throwable $e) {
                \Log::warning('Appointment status notification failed: ' . $e->getMessage());
            }
        }

        return response()->json(['appointment' => $appointment->fresh()]);
    }

    /**
     * DELETE /api/appointments/{id} — Soft delete
     */
    public function destroy(string $id)
    {
        $appointment = Appointment::active()->findOrFail($id);

        // Release slot
        if ($appointment->slot_id) {
            CalendarSlot::where('id', $appointment->slot_id)->update(['is_available' => true]);
        }

        $appointment->update(['is_active' => false]);

        return response()->json(['message' => 'Appointment deleted.']);
    }
}
