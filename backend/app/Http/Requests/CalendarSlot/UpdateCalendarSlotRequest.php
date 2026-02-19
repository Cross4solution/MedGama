<?php

namespace App\Http\Requests\CalendarSlot;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCalendarSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slot_date'        => 'sometimes|date',
            'start_time'       => 'sometimes|string',
            'duration_minutes' => 'sometimes|integer|min:5|max:480',
            'is_available'     => 'sometimes|boolean',
        ];
    }
}
