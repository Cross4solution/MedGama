<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;

class HospitalController extends Controller
{
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
