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
            'status'                => 'sometimes|in:pending,confirmed,cancelled,completed',
            'confirmation_note'     => 'sometimes|string|max:500',
            'doctor_note'           => 'sometimes|string',
            'video_conference_link' => 'sometimes|string|url',
        ];
    }
}
