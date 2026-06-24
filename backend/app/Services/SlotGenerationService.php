<?php

namespace App\Services;

use App\Models\CalendarSlot;
use Illuminate\Support\Carbon;

/**
 * Turn a doctor's weekly operating_hours into concrete bookable calendar_slots
 * so that setting working hours is enough to be booked (no manual slot entry).
 *
 * Adds missing slots within open ranges (minus breaks) for the next N weeks.
 * Never touches existing slots — booked ones (is_available=false) stay intact.
 */
class SlotGenerationService
{
    public function generate(string $doctorId, ?string $clinicId, array $operatingHours, int $weeks = 4, int $durationMin = 30): int
    {
        // day-name (lowercase) => entry
        $byDay = [];
        foreach ($operatingHours as $oh) {
            if (!empty($oh['day'])) {
                $byDay[strtolower($oh['day'])] = $oh;
            }
        }
        if (empty($byDay)) {
            return 0;
        }

        $start = Carbon::today();
        $end = (clone $start)->addWeeks($weeks);

        // Existing slots in range → skip duplicates by "date|HH:MM".
        $existing = CalendarSlot::where('doctor_id', $doctorId)
            ->whereBetween('slot_date', [$start->toDateString(), $end->toDateString()])
            ->get(['slot_date', 'start_time'])
            ->map(fn ($s) => $s->slot_date->format('Y-m-d') . '|' . substr((string) $s->start_time, 0, 5))
            ->flip();

        $toInsert = [];
        for ($d = clone $start; $d->lte($end); $d->addDay()) {
            $entry = $byDay[strtolower($d->englishDayOfWeek)] ?? null;
            if (!$entry || !empty($entry['is_closed']) || empty($entry['open']) || empty($entry['close'])) {
                continue;
            }
            $openMin = $this->toMin($entry['open']);
            $closeMin = $this->toMin($entry['close']);
            $breaks = collect($entry['breaks'] ?? [])
                ->map(fn ($b) => [$this->toMin($b['start'] ?? '00:00'), $this->toMin($b['end'] ?? '00:00')])
                ->all();

            for ($m = $openMin; $m + $durationMin <= $closeMin; $m += $durationMin) {
                // Skip if the slot overlaps a break.
                $inBreak = false;
                foreach ($breaks as [$bs, $be]) {
                    if ($m < $be && ($m + $durationMin) > $bs) { $inBreak = true; break; }
                }
                if ($inBreak) {
                    continue;
                }
                $hhmm = sprintf('%02d:%02d', intdiv($m, 60), $m % 60);
                $key = $d->format('Y-m-d') . '|' . $hhmm;
                if ($existing->has($key)) {
                    continue;
                }
                $toInsert[] = [
                    'id'               => (string) \Illuminate\Support\Str::uuid(),
                    'doctor_id'        => $doctorId,
                    'clinic_id'        => $clinicId,
                    'slot_date'        => $d->toDateString(),
                    'start_time'       => $hhmm,
                    'duration_minutes' => $durationMin,
                    'is_available'     => true,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }
        }

        foreach (array_chunk($toInsert, 500) as $chunk) {
            CalendarSlot::insert($chunk);
        }
        return count($toInsert);
    }

    private function toMin(string $hhmm): int
    {
        $p = explode(':', $hhmm);
        return ((int) ($p[0] ?? 0)) * 60 + (int) ($p[1] ?? 0);
    }
}
