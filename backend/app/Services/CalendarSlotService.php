<?php

namespace App\Services;

use App\Models\CalendarSlot;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CalendarSlotService
{
    /**
     * List calendar slots with filters.
     */
    public function list(array $filters): LengthAwarePaginator
    {
        $query = CalendarSlot::active()
            ->with(['doctor:id,fullname,avatar', 'clinic:id,fullname']);

        $query->when($filters['doctor_id'] ?? null, fn($q, $v) => $q->where('doctor_id', $v))
              ->when($filters['clinic_id'] ?? null, fn($q, $v) => $q->where('clinic_id', $v))
              ->when($filters['date'] ?? null, fn($q, $v) => $q->whereDate('slot_date', $v))
              ->when($filters['available'] ?? null, fn($q) => $q->available());

        return $query
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->paginate($filters['per_page'] ?? 50);
    }

    /**
     * Takvimi yönetme yetkisi — hekimin kendisi, kliniği ya da yönetici.
     *
     * Bu denetim HİÇ YOKTU. Sonuçları uçtan ölçüldü: bir hekim başka bir
     * hekimin adına slot açabiliyor (201) ve mevcut slotlarını müsait
     * olmaktan çıkarabiliyordu (200). İkincisi rakibin takvimini dolu
     * göstermek demek — hasta o hekimden randevu alamaz ve kimse bir şeyin
     * yanlış olduğunu görmez.
     *
     * `doctor_id` istekten geldiği için doğrulama tek başına yetmiyor:
     * geçerli bir kimlik olması, ÇAĞIRANIN o takvime yetkili olduğu
     * anlamına gelmiyor.
     */
    public function yetkiliMi(User $aktor, string $doctorId): bool
    {
        if ($aktor->isAdmin() || $aktor->id === $doctorId) {
            return true;
        }

        // Klinik sahibi kendi kliniğine bağlı hekimlerin takvimini yönetebilir.
        if ($aktor->isClinicOwner() && $aktor->clinic_id) {
            return User::where('id', $doctorId)
                ->where('clinic_id', $aktor->clinic_id)
                ->exists();
        }

        return false;
    }

    /** Yetki yoksa isteği keser. */
    public function yetkiZorunlu(User $aktor, string $doctorId): void
    {
        abort_unless($this->yetkiliMi($aktor, $doctorId), 403, 'Bu takvimi yönetme yetkiniz yok.');
    }

    /**
     * Create a single calendar slot.
     */
    public function store(array $data): CalendarSlot
    {
        $data['is_available'] = true;

        return CalendarSlot::create($data);
    }

    /**
     * Bulk-create multiple slots inside a transaction.
     *
     * @return array{slots: CalendarSlot[], count: int}
     */
    public function bulkStore(array $data): array
    {
        $slots = DB::transaction(function () use ($data) {
            $created = [];

            foreach ($data['slots'] as $slotData) {
                $created[] = CalendarSlot::create([
                    'doctor_id'        => $data['doctor_id'],
                    'clinic_id'        => $data['clinic_id'] ?? null,
                    'slot_date'        => $slotData['slot_date'],
                    'start_time'       => $slotData['start_time'],
                    'duration_minutes' => $slotData['duration_minutes'] ?? 30,
                    'is_available'     => true,
                ]);
            }

            return $created;
        });

        return ['slots' => $slots, 'count' => count($slots)];
    }

    /**
     * Update a calendar slot.
     */
    public function update(string $id, array $data, User $aktor): CalendarSlot
    {
        $slot = CalendarSlot::active()->findOrFail($id);
        $this->yetkiZorunlu($aktor, $slot->doctor_id);

        $slot->update($data);

        return $slot->refresh();
    }

    /**
     * Soft-delete a calendar slot.
     */
    public function destroy(string $id, User $aktor): void
    {
        $slot = CalendarSlot::active()->findOrFail($id);
        $this->yetkiZorunlu($aktor, $slot->doctor_id);

        // `is_active` $fillable İÇİNDE DEĞİL, dolayısıyla update() onu sessizce
        // eliyordu: uç 200 dönüyor ama slot silinmiyordu. forceFill toplu
        // atama korumasını bozmadan bu tek alanı yazıyor.
        $slot->forceFill(['is_active' => false])->save();
    }
}
