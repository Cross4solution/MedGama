<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DoctorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function __construct(private readonly DoctorService $doctorService) {}

    /**
     * GET /api/doctors — Public list of doctors (Doc §3 / §8.3)
     *
     * Query params: search_text, specialty_id, city_id, language,
     *               min_rating, gender, online_only, clinic_id,
     *               verified, sort, per_page
     */
    public function index(Request $request): JsonResponse
    {
        $doctors = $this->doctorService->listDoctors(
            $request->only([
                'search_text', 'specialty_id', 'city_id', 'language',
                'min_rating', 'gender', 'online_only', 'clinic_id',
                'verified', 'sort', 'per_page',
                // Legacy compat
                'search', 'specialty',
            ]),
        );

        return response()->json($doctors);
    }

    /**
     * GET /api/doctors/suggestions — "Did you mean?" when search returns 0
     *
     * Query params: search_text, city_id
     */
    public function suggestions(Request $request): JsonResponse
    {
        $data = $this->doctorService->suggestions(
            $request->only(['search_text', 'city_id']),
        );

        return response()->json($data);
    }

    /**
     * GET /api/doctors/{id} — Public doctor profile (full detail + review stats)
     */
    public function show(string $id): JsonResponse
    {
        $data = $this->doctorService->getDoctor($id);

        if (!$data) {
            return response()->json(['message' => 'Doctor not found.'], 404);
        }

        return response()->json($data);
    }

    /**
     * GET /api/doctors/{id}/reviews — Public reviews list (paginated)
     */
    public function reviews(Request $request, string $id): JsonResponse
    {
        $reviews = $this->doctorService->getDoctorReviews(
            $id,
            (int) $request->query('per_page', 10),
        );

        return response()->json($reviews);
    }

    /**
     * POST /api/doctors/{id}/reviews — Submit a review (auth required)
     */
    public function submitReview(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $review = $this->doctorService->submitReview(
            $request->user(),
            $id,
            $request->only(['rating', 'comment']),
        );

        return response()->json(['review' => $review->load('patient:id,fullname,avatar')], 201);
    }

    /**
     * GET /api/doctors/{id}/availability — Public availability (slots grouped by date)
     */
    public function availability(Request $request, string $id): JsonResponse
    {
        $slots = $this->doctorService->getDoctorAvailability(
            $id,
            $request->query('date'),
        );

        return response()->json(['availability' => $slots]);
    }
}
