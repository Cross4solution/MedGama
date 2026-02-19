<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'patient_id'            => $this->patient_id,
            'doctor_id'             => $this->doctor_id,
            'clinic_id'             => $this->clinic_id,
            'slot_id'               => $this->slot_id,
            'appointment_type'      => $this->appointment_type,
            'appointment_date'      => $this->appointment_date,
            'appointment_time'      => $this->appointment_time,
            'status'                => $this->status,
            'confirmation_note'     => $this->confirmation_note,
            'doctor_note'           => $this->doctor_note,
            'video_conference_link' => $this->video_conference_link,
            'created_by'            => $this->created_by,
            'created_at'            => $this->created_at?->toISOString(),
            'updated_at'            => $this->updated_at?->toISOString(),

            // Relations (only when loaded)
            'patient' => $this->whenLoaded('patient', fn() => [
                'id'       => $this->patient->id,
                'fullname' => $this->patient->fullname,
                'avatar'   => $this->patient->avatar,
                'email'    => $this->patient->email,
                'mobile'   => $this->patient->mobile,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn() => [
                'id'       => $this->doctor->id,
                'fullname' => $this->doctor->fullname,
                'avatar'   => $this->doctor->avatar,
            ]),
            'clinic' => $this->whenLoaded('clinic', fn() => [
                'id'       => $this->clinic->id,
                'fullname' => $this->clinic->fullname,
            ]),
            'slot' => $this->whenLoaded('slot'),
        ];
    }
}
