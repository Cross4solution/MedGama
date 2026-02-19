<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SuperAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SuperAdminController extends Controller
{
    public function __construct(
        private readonly SuperAdminService $superAdminService,
    ) {}

    // ══════════════════════════════════════════════
    //  GLOBAL DASHBOARD
    // ══════════════════════════════════════════════

    #[OA\Get(
        path: '/admin/dashboard',
        summary: 'Platform-wide dashboard: users, appointments, MedStream stats',
        security: [['sanctum' => []]],
        tags: ['SuperAdmin'],
        responses: [
            new OA\Response(response: 200, description: 'Global dashboard summary'),
            new OA\Response(response: 403, description: 'Not a superAdmin'),
        ]
    )]
    public function dashboard(): JsonResponse
    {
        $data = $this->superAdminService->getGlobalDashboard();

        return response()->json(['data' => $data]);
    }

    // ══════════════════════════════════════════════
    //  DOCTOR VERIFICATION
    // ══════════════════════════════════════════════

    #[OA\Get(
        path: '/admin/doctors',
        summary: 'List doctors with verification status (filterable)',
        security: [['sanctum' => []]],
        tags: ['SuperAdmin'],
        parameters: [
            new OA\Parameter(name: 'verified', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated doctor list'),
        ]
    )]
    public function doctors(Request $request): JsonResponse
    {
        $doctors = $this->superAdminService->listDoctors(
            $request->only(['verified', 'search', 'per_page']),
        );

        return response()->json($doctors);
    }

    #[OA\Put(
        path: '/admin/doctors/{id}/verify',
        summary: 'Verify or reject a doctor',
        security: [['sanctum' => []]],
        tags: ['SuperAdmin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['verified'],
                properties: [
                    new OA\Property(property: 'verified', type: 'boolean'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Doctor verification updated'),
            new OA\Response(response: 404, description: 'Doctor not found'),
        ]
    )]
    public function verifyDoctor(Request $request, string $id): JsonResponse
    {
        $request->validate(['verified' => 'required|boolean']);

        $doctor = $this->superAdminService->updateDoctorVerification(
            $id,
            (bool) $request->input('verified'),
        );

        return response()->json([
            'message' => $doctor->is_verified ? 'Doctor verified.' : 'Doctor verification revoked.',
            'doctor'  => [
                'id'          => $doctor->id,
                'fullname'    => $doctor->fullname,
                'email'       => $doctor->email,
                'is_verified' => $doctor->is_verified,
            ],
        ]);
    }

    // ══════════════════════════════════════════════
    //  CONTENT MODERATION
    // ══════════════════════════════════════════════

    #[OA\Get(
        path: '/admin/reports',
        summary: 'List reported MedStream posts (with post + reporter info)',
        security: [['sanctum' => []]],
        tags: ['SuperAdmin'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string', enum: ['pending', 'reviewed', 'hidden'])),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated reported posts'),
        ]
    )]
    public function reports(Request $request): JsonResponse
    {
        $reports = $this->superAdminService->listReportedPosts(
            $request->only(['status', 'per_page']),
        );

        return response()->json($reports);
    }

    #[OA\Put(
        path: '/admin/reports/{id}/approve',
        summary: 'Dismiss report (mark as reviewed, keep post visible)',
        security: [['sanctum' => []]],
        tags: ['SuperAdmin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Report dismissed'),
        ]
    )]
    public function approveReport(string $id): JsonResponse
    {
        $report = $this->superAdminService->approveReport($id);

        return response()->json([
            'message' => 'Report dismissed. Post remains visible.',
            'report'  => $report,
        ]);
    }

    #[OA\Delete(
        path: '/admin/reports/{id}/remove',
        summary: 'Remove reported content (hide post + mark report as actioned)',
        security: [['sanctum' => []]],
        tags: ['SuperAdmin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Post hidden, report actioned'),
        ]
    )]
    public function removeReport(string $id): JsonResponse
    {
        $report = $this->superAdminService->removeReportedContent($id);

        return response()->json([
            'message' => 'Post has been hidden. Report marked as actioned.',
            'report'  => $report,
        ]);
    }
}
