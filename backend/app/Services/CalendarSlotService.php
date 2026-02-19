<?php

namespace App\Services;

use App\Models\CalendarSlot;
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
    public function update(string $id, array $data): CalendarSlot
    {
        $slot = CalendarSlot::active()->findOrFail($id);
        $slot->update($data);

        return $slot->refresh();
    }

    /**
     * Soft-delete a calendar slot.
     */
    public function destroy(string $id): void
    {
        $slot = CalendarSlot::active()->findOrFail($id);
        $slot->update(['is_active' => false]);
    }
}
