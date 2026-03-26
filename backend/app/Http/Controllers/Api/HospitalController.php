<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HospitalController extends Controller
{
    /**
     * GET /api/hospitals/stats
     *
     * Authenticated endpoint for hospital CRM Dashboard stat cards.
     * Returns aggregate counts for the hospital owned by the current user.
     *
     * Performance: uses withCount() eager loading — single query per relation.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $hospital = $user->ownedHospital ?? $user->hospital;

        if (!$hospital) {
            return response()->json(['error' => 'No hospital associated with this account.'], 403);
        }

        // Eager-load counts in one go to avoid N+1
        $hospital->loadCount([
            'branches',                          // total branch rows
            'branches as active_branches_count'  => fn ($q) => $q->where('is_active', true),
        ]);

        // Unique clinics across all branches (clinic_branches pivot)
        $clinicsCount = DB::table('clinic_branches')
            ->whereIn('branch_id', $hospital->branches()->pluck('id'))
            ->distinct('clinic_id')
            ->count('clinic_id');

        // Assigned doctors across all branches (doctor_branches pivot)
        $doctorsCount = DB::table('doctor_branches')
            ->whereIn('branch_id', $hospital->branches()->pluck('id'))
            ->distinct('doctor_id')
            ->count('doctor_id');

        return response()->json([
            'stats' => [
                'total_branches'  => $hospital->branches_count,
                'active_branches' => $hospital->active_branches_count,
                'total_clinics'   => $clinicsCount,
                'total_doctors'   => $doctorsCount,
            ],
        ]);
    }

    /**
     * GET /api/hospitals/{codename}
     *
     * Public hospital profile page.
     * Returns hospital info + active branches with their primary clinic.
     * L4 Rule: No appointment data is exposed here — branches handle their own booking.
     */
    public function show(string $codename): JsonResponse
    {
        $hospital = Hospital::where('codename', $codename)
            ->where('is_active', true)
            ->firstOrFail();

        // Load branches (active only) with their linked clinics
        $hospital->load([
            'branches' => function ($q) {
                $q->where('is_active', true)
                  ->withCount(['clinics', 'doctors'])
                  ->with([
                      'clinics:id,name,codename,fullname,avatar,address,specialties',
                  ])
                  ->orderBy('name');
            },
            'owner:id,fullname,avatar,title',
        ]);

        // Clinic count across all branches
        $hospital->clinics_count = $hospital->clinics()->count();

        return response()->json(['hospital' => $hospital]);
    }
}
