<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDoctorVerified
{
    /**
     * Block unverified doctors from critical write endpoints.
     *
     * Non-doctor roles (patient, clinicOwner, superAdmin, etc.) pass through.
     * Doctors who have completed onboarding but are NOT yet admin-verified
     * receive a 403 with a machine-readable code so the frontend can show
     * the appropriate lock banner.
     *
     * Usage: ->middleware('verified.doctor')
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Only restrict doctors — other roles pass through
        if ($user->role_id !== 'doctor') {
            return $next($request);
        }

        // If doctor is already verified, allow
        if ($user->is_verified) {
            return $next($request);
        }

        // Unverified doctor → 403
        return response()->json([
            'success' => false,
            'message' => 'Your account is under review. Admin approval is required to use this feature.',
            'code'    => 'DOCTOR_NOT_VERIFIED',
        ], 403);
    }
}
