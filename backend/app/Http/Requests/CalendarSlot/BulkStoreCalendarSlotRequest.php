<?php

namespace App\Http\Requests\CalendarSlot;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreCalendarSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doctor_id'                  => 'required|uuid|exists:users,id',
            'clinic_id'                  => 'sometimes|uuid|exists:clinics,id',
            'slots'                      => 'required|array|min:1',
            'slots.*.slot_date'          => 'required|date|after_or_equal:today',
            'slots.*.start_time'         => 'required|string',
            'slots.*.duration_minutes'   => 'sometimes|integer|min:5|max:480',
        ];
    }
}
