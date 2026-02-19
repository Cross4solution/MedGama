<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CalendarSlot\StoreCalendarSlotRequest;
use App\Http\Requests\CalendarSlot\BulkStoreCalendarSlotRequest;
use App\Http\Requests\CalendarSlot\UpdateCalendarSlotRequest;
use App\Http\Resources\CalendarSlotResource;
use App\Services\CalendarSlotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CalendarSlotController extends Controller
{
    public function __construct(
        private readonly CalendarSlotService $calendarSlotService,
    ) {}

    /**
     * GET /api/calendar-slots
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $slots = $this->calendarSlotService->list(
            $request->only(['doctor_id', 'clinic_id', 'date', 'available', 'per_page']),
        );

        return CalendarSlotResource::collection($slots);
    }

    /**
     * POST /api/calendar-slots
     */
    public function store(StoreCalendarSlotRequest $request): JsonResponse
    {
        $slot = $this->calendarSlotService->store($request->validated());

        return (new CalendarSlotResource($slot))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/calendar-slots/bulk — Create multiple slots at once
     */
    public function bulkStore(BulkStoreCalendarSlotRequest $request): JsonResponse
    {
        $result = $this->calendarSlotService->bulkStore($request->validated());

        return response()->json([
            'slots' => CalendarSlotResource::collection(collect($result['slots'])),
            'count' => $result['count'],
        ], 201);
    }

    /**
     * PUT /api/calendar-slots/{id}
     */
    public function update(UpdateCalendarSlotRequest $request, string $id): JsonResponse
    {
        $slot = $this->calendarSlotService->update($id, $request->validated());

        return (new CalendarSlotResource($slot))->response();
    }

    /**
     * DELETE /api/calendar-slots/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $this->calendarSlotService->destroy($id);

        return response()->json(['message' => 'Slot deleted.']);
    }
}
