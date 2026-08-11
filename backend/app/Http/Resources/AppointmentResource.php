<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    use Concerns\ResolvesMediaUrls;

    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'patient_id'            => $this->patient_id,
            'doctor_id'             => $this->doctor_id,
            'clinic_id'             => $this->clinic_id,
            'slot_id'               => $this->slot_id,
            'appointment_type'      => $this->appointment_type,
            // Takvim günü olarak gönderilir (Y-m-d). Tam ISO zaman damgası
            // gönderilirse geri saat dilimlerindeki kullanıcı (ör. ABD) randevuyu
            // bir gün ÖNCE görüyordu — "2026-08-11T00:00:00Z" yerelde 10 Ağustos oluyor.
            'appointment_date'      => $this->appointment_date?->toDateString(),
            'appointment_time'      => $this->appointment_time,
            // Mutlak an (UTC, ISO-8601) + duvar saatinin ait olduğu saat dilimi.
            // Arayüz saati izleyenin kendi saat diliminde gösterir; taraflar
            // farklıysa kliniğin saatini de yazar. Yalnız "14:00" göndermek,
            // yurt dışındaki hasta için hangi 14:00 olduğunu belirsiz bırakıyordu.
            'starts_at'             => $this->startsAt()?->toISOString(),
            'timezone'              => $this->timezoneName(),
            'status'                => $this->status,
            // Onaylı Review Sistemi alanları
            'deposit_status'        => $this->deposit_status,
            'deposit_amount'        => $this->deposit_amount,
            'auto_completed_at'     => $this->auto_completed_at?->toISOString(),
            'confirmation_note'     => $this->confirmation_note,
            'doctor_note'           => $this->doctor_note,
            'patient_medical_snapshot' => $this->patient_medical_snapshot,
            'video_conference_link' => $this->video_conference_link,
            'created_by'            => $this->created_by,
            // Doktorun "Reddet" düğmesi bu bilgiye göre gösterilir; kural sunucuda
            // da uygulanır (arayüzde gizlemek tek başına yeterli değil).
            'doctor_can_reject'     => $this->doctorCanReject(),
            'created_at'            => $this->created_at?->toISOString(),
            'updated_at'            => $this->updated_at?->toISOString(),

            // Relations (only when loaded)
            'patient' => $this->whenLoaded('patient', fn() => [
                'id'       => $this->patient->id,
                'fullname' => $this->patient->fullname,
                'avatar'   => self::resolveMediaUrl($this->patient->avatar),
                'email'    => $this->patient->email,
                'mobile'   => $this->patient->mobile,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn() => [
                'id'       => $this->doctor->id,
                'fullname' => $this->doctor->fullname,
                'avatar'   => self::resolveMediaUrl($this->doctor->avatar),
            ]),
            'clinic' => $this->whenLoaded('clinic', fn() => [
                'id'       => $this->clinic->id,
                'fullname' => $this->clinic->fullname,
            ]),
            'slot' => $this->whenLoaded('slot'),
        ];
    }
}
