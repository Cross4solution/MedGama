<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDoctorVerified
{
    /**
     * Platform access gate for appointments / telehealth endpoints.
     *
     * Business rules (MedaGama Level System):
     *   • Level 3 (Clinic/clinicOwner) → ALWAYS allowed (no verification needed for platform features).
     *   • Level 5 (Admin)              → ALWAYS allowed.
     *   • Level 2 (Doctor)             → Must be admin-verified (is_verified = true).
     *   • Level 4 (Hospital)           → BLOCKED — hospitals are a "Promotion Network", no appointment system.
     *   • Level 1 (Patient)            → Passes through (patients book appointments normally).
     *
     * Usage: ->middleware('verified.doctor')
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $level = (int) $user->user_level;

        // Level 5 (Admin) → always allowed
        if ($level >= 5) {
            return $next($request);
        }

        // Level 3 (Clinic) → bypass verification, can use platform features immediately
        if ($level === 3) {
            return $next($request);
        }

        // Level 4 (Hospital) → no appointment system, promotion network only
        if ($level === 4) {
            return response()->json([
                'success' => false,
                'message' => 'Hospitals operate as a Promotion Network. Appointment features are not available for this account level.',
                'code'    => 'HOSPITAL_NO_APPOINTMENTS',
            ], 403);
        }

        // Level 1 (Patient) → patients can book appointments normally
        if ($level === 1) {
            return $next($request);
        }

        // Level 2 (Doctor) → must be admin-verified
        if ($user->role_id === 'doctor' && !$user->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is under review. Admin approval is required to use this feature.',
                'code'    => 'DOCTOR_NOT_VERIFIED',
            ], 403);
        }

        return $next($request);
    }
}
