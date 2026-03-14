<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'                => 'sometimes|in:pending,confirmed,cancelled,completed,no_show',
            'appointment_type'      => 'sometimes|in:inPerson,online,phone',
            'appointment_date'      => 'sometimes|date',
            'appointment_time'      => 'sometimes|string',
            'confirmation_note'     => 'sometimes|string|max:500',
            'doctor_note'           => 'sometimes|string',
            'video_conference_link' => 'sometimes|string|url',
        ];
    }
}
