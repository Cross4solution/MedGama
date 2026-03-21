<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clinic;
use App\Models\ClinicVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ClinicVerificationController extends Controller
{
    /**
     * Get current clinic verification status + latest submission
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $clinic = $this->resolveClinic($user);

        if (!$clinic) {
            return response()->json(['message' => 'No clinic found'], 404);
        }

        $latest = $clinic->latestVerification;

        return response()->json([
            'verification_status' => $clinic->verification_status ?? 'unverified',
            'is_verified' => $clinic->is_verified,
            'latest_submission' => $latest ? [
                'id' => $latest->id,
                'status' => $latest->status,
                'business_registration' => $latest->business_registration ? true : false,
                'operating_license' => $latest->operating_license ? true : false,
                'tax_plate' => $latest->tax_plate ? true : false,
                'representative_id' => $latest->representative_id ? true : false,
                'admin_notes' => $latest->admin_notes,
                'submitted_at' => $latest->created_at,
                'reviewed_at' => $latest->reviewed_at,
            ] : null,
        ]);
    }

    /**
     * Submit clinic verification documents (4 files)
     */
    public function submit(Request $request): JsonResponse
    {
        $request->validate([
            'business_registration' => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
            'operating_license'     => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
            'tax_plate'             => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
            'representative_id'     => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
        ]);

        $user = $request->user();
        $clinic = $this->resolveClinic($user);

        if (!$clinic) {
            return response()->json(['message' => 'No clinic found'], 404);
        }

        // Prevent resubmission if already pending
        if ($clinic->verification_status === 'pending_review') {
            return response()->json(['message' => 'Verification already pending review'], 422);
        }

        return DB::transaction(function () use ($request, $user, $clinic) {
            $basePath = "clinic-verifications/{$clinic->id}";

            $paths = [];
            foreach (['business_registration', 'operating_license', 'tax_plate', 'representative_id'] as $field) {
                if ($request->hasFile($field)) {
                    $paths[$field] = $request->file($field)->store("{$basePath}/{$field}", 'public');
                }
            }

            $verification = ClinicVerification::create([
                'clinic_id'             => $clinic->id,
                'submitted_by'          => $user->id,
                'business_registration' => $paths['business_registration'] ?? null,
                'operating_license'     => $paths['operating_license'] ?? null,
                'tax_plate'             => $paths['tax_plate'] ?? null,
                'representative_id'     => $paths['representative_id'] ?? null,
                'status'                => 'pending_review',
            ]);

            // Update clinic status
            $clinic->update([
                'verification_status' => 'pending_review',
            ]);

            return response()->json([
                'message' => 'Verification documents submitted successfully',
                'verification_status' => 'pending_review',
                'verification_id' => $verification->id,
            ], 201);
        });
    }

    // ════════════════════════════════════════════════
    // Admin endpoints
    // ════════════════════════════════════════════════

    /**
     * List pending clinic verifications (admin)
     */
    public function adminList(Request $request): JsonResponse
    {
        $query = ClinicVerification::with(['clinic:id,name,codename,avatar', 'submitter:id,name,email'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'pending_review');
        }

        $verifications = $query->paginate($request->per_page ?? 20);

        return response()->json($verifications);
    }

    /**
     * Approve a clinic verification
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $verification = ClinicVerification::findOrFail($id);

        return DB::transaction(function () use ($request, $verification) {
            $verification->update([
                'status'      => 'approved',
                'admin_notes' => $request->notes,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            $verification->clinic->update([
                'verification_status' => 'verified',
                'is_verified'         => true,
            ]);

            AuditLog::log(
                action: 'clinic_verification.approved',
                resourceType: 'ClinicVerification',
                resourceId: $verification->id,
                newValues: ['clinic_id' => $verification->clinic_id, 'status' => 'approved'],
                description: "Approved clinic verification for: {$verification->clinic->name}",
            );

            Cache::forget('superadmin:dashboard');

            return response()->json([
                'message' => 'Clinic verification approved',
                'verification_status' => 'verified',
            ]);
        });
    }

    /**
     * Reject a clinic verification
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate(['notes' => 'required|string|min:5']);

        $verification = ClinicVerification::findOrFail($id);

        return DB::transaction(function () use ($request, $verification) {
            $verification->update([
                'status'      => 'rejected',
                'admin_notes' => $request->notes,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            $verification->clinic->update([
                'verification_status' => 'rejected',
            ]);

            AuditLog::log(
                action: 'clinic_verification.rejected',
                resourceType: 'ClinicVerification',
                resourceId: $verification->id,
                newValues: ['clinic_id' => $verification->clinic_id, 'status' => 'rejected', 'notes' => $request->notes],
                description: "Rejected clinic verification for: {$verification->clinic->name}",
            );

            return response()->json([
                'message' => 'Clinic verification rejected',
                'verification_status' => 'rejected',
            ]);
        });
    }

    // ════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════

    private function resolveClinic($user): ?Clinic
    {
        // clinicOwner → owns a clinic
        if ($user->role_id === 'clinicOwner') {
            return Clinic::where('owner_id', $user->id)->first();
        }
        // doctor → belongs to a clinic
        if ($user->clinic_id) {
            return Clinic::find($user->clinic_id);
        }
        return null;
    }
}
