<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanPublishMedStream
{
    /**
     * MedStream publish gate (creating/editing posts).
     *
     * Business rules:
     *   • Doctors (verified), Clinics, Clinic owners, Hospitals → may publish.
     *   • Admins → always allowed.
     *   • Patients → may NOT publish (comment + like only — those routes are auth-only).
     *
     * Usage: ->middleware('medstream.publish')
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Admins
        if ((int) $user->user_level >= 5) {
            return $next($request);
        }

        // Doctors must be admin-verified
        if ($user->role_id === 'doctor') {
            if (!$user->is_verified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is under review. Admin approval is required to publish.',
                    'code'    => 'DOCTOR_NOT_VERIFIED',
                ], 403);
            }
            return $next($request);
        }

        // Clinics, clinic owners, hospitals (clinic groups) may publish
        if (in_array($user->role_id, ['clinic', 'clinicOwner', 'hospital'], true)) {
            return $next($request);
        }

        // Everyone else (patients) — cannot publish
        return response()->json([
            'success' => false,
            'message' => 'Only clinics, clinic groups and doctors can publish on MedStream. You can still comment and like.',
            'code'    => 'CANNOT_PUBLISH_MEDSTREAM',
        ], 403);
    }
}
