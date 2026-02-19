<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClinicStatsResource;
use App\Services\ClinicAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ClinicAnalyticsController extends Controller
{
    public function __construct(
        private readonly ClinicAnalyticsService $analyticsService,
    ) {}

    #[OA\Get(
        path: '/analytics/clinic/{clinicId}/summary',
        summary: 'Clinic monthly summary: appointments, cancellation rate, new patients, MedStream engagement',
        description: 'Cached for 1 hour. Only accessible by the clinic owner or a superAdmin.',
        security: [['sanctum' => []]],
        tags: ['Analytics'],
        parameters: [
            new OA\Parameter(name: 'clinicId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Clinic summary (ClinicStatsResource)'),
            new OA\Response(response: 403, description: 'Not the clinic owner', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function summary(Request $request, string $clinicId): JsonResponse
    {
        $this->authorizeClinicAccess($request->user(), $clinicId);

        $data = $this->analyticsService->getClinicSummary($clinicId);

        return (new ClinicStatsResource($data))->response();
    }

    #[OA\Get(
        path: '/analytics/clinic/{clinicId}/doctors',
        summary: 'Per-doctor performance: completed appointments, post count, profile views',
        description: 'Cached for 1 hour. Only accessible by the clinic owner or a superAdmin.',
        security: [['sanctum' => []]],
        tags: ['Analytics'],
        parameters: [
            new OA\Parameter(name: 'clinicId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Array of doctor performance objects'),
            new OA\Response(response: 403, description: 'Not the clinic owner', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function doctorPerformance(Request $request, string $clinicId): JsonResponse
    {
        $this->authorizeClinicAccess($request->user(), $clinicId);

        $data = $this->analyticsService->getDoctorPerformance($clinicId);

        return response()->json(['data' => $data]);
    }

    /**
     * Ensure the authenticated user is the clinic owner or a superAdmin.
     */
    private function authorizeClinicAccess(\App\Models\User $user, string $clinicId): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if (!$user->isClinicOwner() || $user->clinic_id !== $clinicId) {
            abort(403, 'You do not have access to this clinic\'s analytics.');
        }
    }
}
