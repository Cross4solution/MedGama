<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isDoctor = $this->isCreatedByDoctor();

        $rules = [
            // doctor_id artık clinic_id varsa zorunlu değil (klinik randevusu)
            // ancak klinik randevusunda da seçilen klinik doktoru gönderilir.
            'doctor_id'         => 'required_without:clinic_id|nullable|uuid|exists:users,id',
            'clinic_id'         => 'required_without:doctor_id|nullable|uuid|exists:clinics,id',
            'appointment_type'  => 'required|in:inPerson,online,phone',
            'slot_id'           => 'sometimes|nullable|uuid|exists:calendar_slots,id',
            'appointment_date'  => 'required|date|after_or_equal:today',
            'appointment_time'  => 'required|string',
            'confirmation_note' => 'sometimes|string|max:500',
        ];

        if ($isDoctor) {
            // Doctor/clinicOwner booking on behalf of a patient
            $rules['patient_id']    = 'sometimes|uuid|exists:users,id';
            $rules['patient_name']  = 'required_without:patient_id|string|max:255';
            $rules['patient_email'] = 'required_without:patient_id|email|max:255';
            $rules['patient_phone'] = 'sometimes|string|max:50';
            $rules['patient_dob']   = 'sometimes|date';
        } else {
            // Patient booking for themselves — must be their own ID
            $rules['patient_id'] = [
                'required', 'uuid', 'exists:users,id',
                'in:' . $this->user()->id,
            ];
        }

        return $rules;
    }

    /**
     * Custom error messages.
     */
    public function messages(): array
    {
        return [
            'patient_id.in' => 'You can only create appointments for yourself.',
        ];
    }

    /**
     * Helper: is the authenticated user a doctor/clinicOwner?
     */
    public function isCreatedByDoctor(): bool
    {
        return in_array($this->user()->role_id, ['doctor', 'clinicOwner']);
    }
}
