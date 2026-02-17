<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\AppointmentBookedMail;
use App\Mail\AppointmentConfirmedMail;
use App\Mail\AppointmentCancelledMail;

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
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'doctor_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'appointment_type' => 'required|in:inPerson,online',
            'slot_id' => 'sometimes|uuid|exists:calendar_slots,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'confirmation_note' => 'sometimes|string|max:500',
        ]);

        $validated['status'] = 'pending';
        $validated['created_by'] = $request->user()->id;

        // Mark slot as unavailable if provided
        if (!empty($validated['slot_id'])) {
            $slot = CalendarSlot::active()->findOrFail($validated['slot_id']);
            if (!$slot->is_available) {
                return response()->json(['message' => 'This time slot is no longer available.'], 422);
            }
            $slot->update(['is_available' => false]);
        }

        $appointment = Appointment::create($validated);

        // Send appointmentBooked notification to patient
        try {
            $patient = User::find($validated['patient_id']);
            $doctor = User::find($validated['doctor_id']);
            if ($patient?->email) {
                Mail::to($patient->email)->send(new AppointmentBookedMail(
                    $patient->fullname ?? 'Patient',
                    $doctor->fullname ?? 'Doctor',
                    $validated['appointment_date'],
                    $validated['appointment_time'],
                    $validated['appointment_type'] ?? 'online',
                ));
            }
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked email failed: ' . $e->getMessage());
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

        // If cancelled, release the slot
        if (isset($validated['status']) && $validated['status'] === 'cancelled' && $appointment->slot_id) {
            CalendarSlot::where('id', $appointment->slot_id)->update(['is_available' => true]);
        }

        // Send notification emails on status change
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            try {
                $patient = $appointment->patient ?? User::find($appointment->patient_id);
                $doctor = $appointment->doctor ?? User::find($appointment->doctor_id);
                $pName = $patient->fullname ?? 'Patient';
                $dName = $doctor->fullname ?? 'Doctor';
                $date = $appointment->appointment_date;
                $time = $appointment->appointment_time;

                if ($validated['status'] === 'confirmed' && $patient?->email) {
                    Mail::to($patient->email)->send(new AppointmentConfirmedMail(
                        $pName, $dName, $date, $time,
                        $appointment->video_conference_link,
                    ));
                } elseif ($validated['status'] === 'cancelled' && $patient?->email) {
                    Mail::to($patient->email)->send(new AppointmentCancelledMail(
                        $pName, $dName, $date, $time,
                    ));
                }
            } catch (\Throwable $e) {
                \Log::warning('Appointment status email failed: ' . $e->getMessage());
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
