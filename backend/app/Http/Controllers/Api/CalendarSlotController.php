<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarSlot;
use Illuminate\Http\Request;

class CalendarSlotController extends Controller
{
    /**
     * GET /api/calendar-slots
     */
    public function index(Request $request)
    {
        $query = CalendarSlot::active()->with(['doctor:id,fullname,avatar', 'clinic:id,fullname']);

        $query->when($request->doctor_id, fn($q, $v) => $q->where('doctor_id', $v))
              ->when($request->clinic_id, fn($q, $v) => $q->where('clinic_id', $v))
              ->when($request->date, fn($q, $v) => $q->whereDate('slot_date', $v))
              ->when($request->available, fn($q) => $q->available());

        $slots = $query->orderBy('slot_date')->orderBy('start_time')
            ->paginate($request->per_page ?? 50);

        return response()->json($slots);
    }

    /**
     * POST /api/calendar-slots
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'slot_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|string',
            'duration_minutes' => 'sometimes|integer|min:5|max:480',
        ]);

        $validated['is_available'] = true;

        $slot = CalendarSlot::create($validated);

        return response()->json(['slot' => $slot], 201);
    }

    /**
     * POST /api/calendar-slots/bulk — Create multiple slots at once
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'slots' => 'required|array|min:1',
            'slots.*.slot_date' => 'required|date|after_or_equal:today',
            'slots.*.start_time' => 'required|string',
            'slots.*.duration_minutes' => 'sometimes|integer|min:5|max:480',
        ]);

        $created = [];
        foreach ($validated['slots'] as $slotData) {
            $created[] = CalendarSlot::create([
                'doctor_id' => $validated['doctor_id'],
                'clinic_id' => $validated['clinic_id'] ?? null,
                'slot_date' => $slotData['slot_date'],
                'start_time' => $slotData['start_time'],
                'duration_minutes' => $slotData['duration_minutes'] ?? 30,
                'is_available' => true,
            ]);
        }

        return response()->json(['slots' => $created, 'count' => count($created)], 201);
    }

    /**
     * PUT /api/calendar-slots/{id}
     */
    public function update(Request $request, string $id)
    {
        $slot = CalendarSlot::active()->findOrFail($id);

        $validated = $request->validate([
            'slot_date' => 'sometimes|date',
            'start_time' => 'sometimes|string',
            'duration_minutes' => 'sometimes|integer|min:5|max:480',
            'is_available' => 'sometimes|boolean',
        ]);

        $slot->update($validated);

        return response()->json(['slot' => $slot->fresh()]);
    }

    /**
     * DELETE /api/calendar-slots/{id}
     */
    public function destroy(string $id)
    {
        $slot = CalendarSlot::active()->findOrFail($id);
        $slot->update(['is_active' => false]);

        return response()->json(['message' => 'Slot deleted.']);
    }
}
