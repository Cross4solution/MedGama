<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalendarSlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'doctor_id'        => $this->doctor_id,
            'clinic_id'        => $this->clinic_id,
            'slot_date'        => $this->slot_date,
            'start_time'       => $this->start_time,
            'duration_minutes' => $this->duration_minutes,
            'is_available'     => (bool) $this->is_available,
            'is_active'        => (bool) $this->is_active,
            'created_at'       => $this->created_at?->toISOString(),
            'updated_at'       => $this->updated_at?->toISOString(),

            'doctor' => $this->whenLoaded('doctor', fn() => [
                'id'       => $this->doctor->id,
                'fullname' => $this->doctor->fullname,
                'avatar'   => $this->doctor->avatar,
            ]),
            'clinic' => $this->whenLoaded('clinic', fn() => [
                'id'       => $this->clinic->id,
                'fullname' => $this->clinic->fullname,
            ]),
        ];
    }
}
