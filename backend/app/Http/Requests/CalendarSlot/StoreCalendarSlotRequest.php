<?php

namespace App\Http\Requests\CalendarSlot;

use Illuminate\Foundation\Http\FormRequest;

class StoreCalendarSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doctor_id'        => 'required|uuid|exists:users,id',
            'clinic_id'        => 'sometimes|uuid|exists:clinics,id',
            'slot_date'        => 'required|date|after_or_equal:today',
            'start_time'       => 'required|string',
            'duration_minutes' => 'sometimes|integer|min:5|max:480',
        ];
    }
}
