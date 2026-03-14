<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckCrmAccess
{
    /**
     * CRM access gate — blocks /api/crm/* for users without an active CRM subscription.
     *
     * Logic:
     *  • superAdmin / saasAdmin → always allowed (platform operators).
     *  • doctor (independent, no clinic) → check user.is_crm_active + crm_expires_at.
     *  • doctor (belongs to a clinic) → check clinic.is_crm_active + crm_expires_at.
     *  • clinicOwner → check their owned clinic's is_crm_active + crm_expires_at.
     *  • hospital → check user.is_crm_active + crm_expires_at (hospital-level subscription).
     *  • everyone else (patient etc.) → rejected by the existing 'role' middleware before
     *    this middleware runs, but we guard here too for safety.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'code'    => 'UNAUTHENTICATED',
            ], 401);
        }

        $role = $user->role_id;

        // Platform admins always have access
        if (in_array($role, ['superAdmin', 'saasAdmin'])) {
            return $next($request);
        }

        // Determine CRM subscription status based on role
        $isActive   = false;
        $expiresAt  = null;

        if (in_array($role, ['clinicOwner'])) {
            // Clinic owner → check owned clinic's subscription
            $clinic = $user->ownedClinic ?? $user->clinic;
            if ($clinic) {
                $isActive  = (bool) $clinic->is_crm_active;
                $expiresAt = $clinic->crm_expires_at;
            }
        } elseif ($role === 'doctor') {
            // Doctor belonging to a clinic → clinic's subscription covers them
            if ($user->clinic_id && $user->clinic) {
                $isActive  = (bool) $user->clinic->is_crm_active;
                $expiresAt = $user->clinic->crm_expires_at;
            } else {
                // Independent doctor → own subscription
                $isActive  = (bool) $user->is_crm_active;
                $expiresAt = $user->crm_expires_at;
            }
        } elseif ($role === 'hospital') {
            // Hospital admin → own subscription
            $isActive  = (bool) $user->is_crm_active;
            $expiresAt = $user->crm_expires_at;
        } else {
            // Any other role (patient, etc.) — no CRM access
            return $this->forbidden();
        }

        // Subscription must be active AND not expired
        if (!$isActive) {
            return $this->forbidden('CRM subscription is not active. Please subscribe to access CRM features.');
        }

        if ($expiresAt && now()->greaterThan($expiresAt)) {
            return $this->forbidden('CRM subscription has expired. Please renew to continue using CRM features.');
        }

        return $next($request);
    }

    private function forbidden(?string $message = null): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message ?? 'CRM access denied. An active subscription is required.',
            'code'    => 'CRM_SUBSCRIPTION_REQUIRED',
        ], 403);
    }
}
