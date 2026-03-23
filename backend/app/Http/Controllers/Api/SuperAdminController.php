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

    // ══════════════════════════════════════════════
    //  USER MANAGEMENT (Doc §14)
    // ══════════════════════════════════════════════

    /**
     * GET /api/admin/users — List all users with filters
     */
    public function listUsers(Request $request): JsonResponse
    {
        $users = $this->superAdminService->listUsers(
            $request->only(['role', 'search', 'is_active', 'is_verified', 'per_page', 'page']),
        );

        return response()->json($users);
    }

    /**
     * GET /api/admin/users/stats — User management summary stats
     */
    public function userStats(): JsonResponse
    {
        return response()->json($this->superAdminService->getUserStats());
    }

    /**
     * GET /api/admin/users/{id} — User 360 detail view
     */
    public function getUserDetail(string $id): JsonResponse
    {
        return response()->json($this->superAdminService->getUserDetail($id));
    }

    /**
     * PUT /api/admin/users/{id}/role — Update user role
     */
    public function updateUserRole(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|string|in:patient,doctor,clinicOwner,superAdmin',
        ]);

        $user = $this->superAdminService->updateUserRole(
            $id,
            $request->input('role'),
            $request->user()->id,
        );

        return response()->json([
            'message' => "User role updated to {$user->role_id}.",
            'user'    => $user->only('id', 'fullname', 'email', 'role_id'),
        ]);
    }

    /**
     * PUT /api/admin/users/{id}/suspend — Suspend or reactivate a user
     */
    public function suspendUser(Request $request, string $id): JsonResponse
    {
        $request->validate(['suspend' => 'required|boolean']);

        $user = $this->superAdminService->suspendUser($id, (bool) $request->input('suspend'));

        return response()->json([
            'message' => $user->is_active ? 'User reactivated.' : 'User suspended.',
            'user'    => [
                'id'        => $user->id,
                'fullname'  => $user->fullname,
                'email'     => $user->email,
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * PUT /api/admin/users/{id}/reset-password — Force reset user password
     */
    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:8|max:100',
        ]);

        $user = \App\Models\User::findOrFail($id);
        $user->update(['password' => bcrypt($request->input('password'))]);

        \App\Models\AuditLog::log(
            action: 'user.password_reset',
            resourceType: 'User',
            resourceId: $user->id,
            description: "Password reset by admin for: {$user->fullname}",
        );

        return response()->json([
            'message' => 'Password has been reset successfully.',
            'user'    => $user->only('id', 'fullname', 'email'),
        ]);
    }

    // ══════════════════════════════════════════════
    //  GROWTH TREND
    // ══════════════════════════════════════════════

    public function growthTrend(): JsonResponse
    {
        $data = $this->superAdminService->getGrowthTrend();

        return response()->json(['data' => $data]);
    }

    // ══════════════════════════════════════════════
    //  FEATURE TOGGLES
    // ══════════════════════════════════════════════

    public function featureToggles(): JsonResponse
    {
        $data = $this->superAdminService->getFeatureToggles();

        return response()->json(['data' => $data]);
    }

    public function updateFeatureToggle(Request $request): JsonResponse
    {
        $request->validate([
            'key'   => 'required|string|max:100',
            'value' => 'required',
        ]);

        $setting = $this->superAdminService->updateFeatureToggle(
            $request->input('key'),
            $request->input('value'),
            $request->user()->id,
        );

        return response()->json([
            'message' => 'Setting updated.',
            'setting' => [
                'key'   => $setting->key,
                'value' => $setting->typed_value,
            ],
        ]);
    }

    // ══════════════════════════════════════════════
    //  AUDIT LOGS
    // ══════════════════════════════════════════════

    public function auditLogs(Request $request): JsonResponse
    {
        $logs = $this->superAdminService->listAuditLogs(
            $request->only(['action', 'resource_type', 'user_id', 'search', 'date_from', 'date_to', 'per_page', 'page']),
        );

        return response()->json($logs);
    }

    /**
     * GET /api/admin/audit-logs/stats — Summary stats for audit log dashboard
     */
    public function auditLogStats(): JsonResponse
    {
        return response()->json($this->superAdminService->auditLogStats());
    }

    /**
     * GET /api/admin/users/search?q=john — Lightweight user search for filters
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $q = $request->input('q', '');
        $users = \App\Models\User::query()
            ->where(function ($query) use ($q) {
                $query->where('fullname', 'ilike', "%{$q}%")
                      ->orWhere('email', 'ilike', "%{$q}%");
            })
            ->select('id', 'fullname', 'email', 'role_id', 'avatar')
            ->limit(20)
            ->get();

        return response()->json($users);
    }

    // ══════════════════════════════════════════════
    //  VERIFICATION REQUESTS (Doc §8.3)
    // ══════════════════════════════════════════════

    /**
     * GET /api/admin/verification-requests/doctor/{doctorId} — Full doctor review detail
     */
    public function doctorVerificationDetail(string $doctorId): JsonResponse
    {
        return response()->json($this->superAdminService->getDoctorVerificationDetail($doctorId));
    }

    /**
     * GET /api/admin/verification-requests — List all verification requests
     */
    public function verificationRequests(Request $request): JsonResponse
    {
        $data = $this->superAdminService->listVerificationRequests(
            $request->only(['status', 'doctor_id', 'search', 'per_page']),
        );

        return response()->json($data);
    }

    /**
     * GET /api/admin/verification-requests/stats — Summary counts
     */
    public function verificationStats(): JsonResponse
    {
        return response()->json($this->superAdminService->getVerificationStats());
    }

    /**
     * PUT /api/admin/verification-requests/{id}/approve
     */
    public function approveVerification(Request $request, string $id): JsonResponse
    {
        $vr = $this->superAdminService->approveVerificationRequest($id, $request->user()->id);

        return response()->json([
            'message' => 'Verification request approved. Doctor is now verified.',
            'verification_request' => $vr,
        ]);
    }

    /**
     * PUT /api/admin/verification-requests/{id}/reject
     */
    public function rejectVerification(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:2000',
        ]);

        $vr = $this->superAdminService->rejectVerificationRequest(
            $id,
            $request->user()->id,
            $request->input('reason'),
        );

        return response()->json([
            'message' => 'Verification request rejected.',
            'verification_request' => $vr,
        ]);
    }

    /**
     * PUT /api/admin/verification-requests/{id}/undo — Revert action back to pending
     */
    public function undoVerification(Request $request, string $id): JsonResponse
    {
        $vr = $this->superAdminService->undoVerificationAction($id, $request->user()->id);

        return response()->json([
            'message' => 'Verification action undone. Request is now pending again.',
            'verification_request' => $vr,
        ]);
    }

    /**
     * PUT /api/admin/verification-requests/{id}/request-info — Request more documents
     */
    public function requestMoreInfo(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $vr = $this->superAdminService->requestMoreInfo(
            $id,
            $request->user()->id,
            $request->input('message'),
        );

        return response()->json([
            'message' => 'Information request sent to doctor.',
            'verification_request' => $vr,
        ]);
    }

    /**
     * GET /api/admin/verification-requests/{id}/document — Download/preview document
     */
    public function verificationDocument(string $id): \Symfony\Component\HttpFoundation\StreamedResponse|JsonResponse
    {
        $vr = \App\Models\VerificationRequest::findOrFail($id);

        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($vr->file_path)) {
            return response()->json(['message' => 'Document file not found.'], 404);
        }

        return \Illuminate\Support\Facades\Storage::disk('local')->download(
            $vr->file_path,
            $vr->file_name,
            ['Content-Type' => $vr->mime_type ?? 'application/octet-stream'],
        );
    }

    // ═══════════════════════════════════════════════════════════════
    //  Review Moderation (Doc §10)
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/reviews — List all reviews with filters
     */
    public function listReviews(Request $request): JsonResponse
    {
        $reviews = $this->superAdminService->listReviews(
            $request->only(['status', 'doctor_id', 'search', 'per_page']),
        );

        return response()->json($reviews);
    }

    /**
     * GET /api/admin/reviews/stats — Review moderation statistics
     */
    public function reviewStats(): JsonResponse
    {
        return response()->json($this->superAdminService->getReviewStats());
    }

    /**
     * PUT /api/admin/reviews/{id}/approve — Approve a review
     */
    public function approveReview(string $id): JsonResponse
    {
        $review = $this->superAdminService->approveReview($id, request()->user()->id);
        return response()->json(['review' => $review]);
    }

    /**
     * PUT /api/admin/reviews/{id}/reject — Reject a review (misleading)
     */
    public function rejectReview(Request $request, string $id): JsonResponse
    {
        $request->validate(['note' => 'nullable|string|max:1000']);

        $review = $this->superAdminService->rejectReview($id, $request->user()->id, $request->input('note'));
        return response()->json(['review' => $review]);
    }

    /**
     * PUT /api/admin/reviews/{id}/hide — Hide a review temporarily
     */
    public function hideReview(Request $request, string $id): JsonResponse
    {
        $request->validate(['note' => 'nullable|string|max:1000']);

        $review = $this->superAdminService->hideReview($id, $request->user()->id, $request->input('note'));
        return response()->json(['review' => $review]);
    }
}
