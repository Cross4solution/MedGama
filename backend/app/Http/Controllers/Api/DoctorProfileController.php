<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use Illuminate\Http\Request;

class DoctorProfileController extends Controller
{
    /**
     * GET /api/doctor-profile — Get authenticated doctor's own profile
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $profile = DoctorProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            // Auto-create empty profile for doctor
            $profile = DoctorProfile::create([
                'user_id' => $user->id,
                'onboarding_step' => 0,
                'onboarding_completed' => false,
            ]);
        }

        return response()->json([
            'profile' => $profile,
            'user' => [
                'id' => $user->id,
                'fullname' => $user->fullname,
                'avatar' => $user->avatar,
                'email' => $user->email,
                'role_id' => $user->role_id,
            ],
        ]);
    }

    /**
     * PUT /api/doctor-profile — Update authenticated doctor's profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $validated = $request->validate([
            'title'              => 'nullable|string|max:255',
            'specialty'          => 'nullable|string|max:255',
            'sub_specialties'    => 'nullable|array',
            'bio'                => 'nullable|string|max:5000',
            'experience_years'   => 'nullable|string|max:50',
            'license_number'     => 'nullable|string|max:100',
            'education'          => 'nullable|array',
            'education.*.degree' => 'required_with:education|string',
            'education.*.school' => 'required_with:education|string',
            'education.*.year'   => 'nullable|string',
            'certifications'       => 'nullable|array',
            'certifications.*.name'   => 'required_with:certifications|string',
            'certifications.*.issuer' => 'nullable|string',
            'certifications.*.year'   => 'nullable|string',
            'services'             => 'nullable|array',
            'services.*.name'        => 'required_with:services|string',
            'services.*.description' => 'nullable|string',
            'prices'               => 'nullable|array',
            'prices.*.label'       => 'required_with:prices|string',
            'prices.*.min'         => 'nullable|numeric',
            'prices.*.max'         => 'nullable|numeric',
            'prices.*.currency'    => 'nullable|string|max:10',
            'languages'          => 'nullable|array',
            'address'            => 'nullable|string|max:500',
            'map_coordinates'    => 'nullable|array',
            'phone'              => 'nullable|string|max:50',
            'website'            => 'nullable|string|max:255',
            'gallery'            => 'nullable|array',
            'online_consultation'  => 'nullable|boolean',
            'accepts_insurance'    => 'nullable|boolean',
            'insurance_providers'  => 'nullable|array',
            'onboarding_step'      => 'nullable|integer|min:0|max:10',
            'onboarding_completed' => 'nullable|boolean',
        ]);

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $profile->update($validated);

        return response()->json([
            'profile' => $profile->refresh(),
            'message' => 'Profile updated successfully',
        ]);
    }

    /**
     * PUT /api/doctor-profile/onboarding — Update onboarding step data
     * Accepts partial updates per step
     */
    public function updateOnboarding(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $step = $request->input('step', $profile->onboarding_step);
        $data = $request->except(['step']);

        // Only allow relevant fields per step
        $profile->fill($data);
        $profile->onboarding_step = max($profile->onboarding_step, $step + 1);

        // If step >= 3 (last step), mark onboarding as completed
        if ($step >= 3) {
            $profile->onboarding_completed = true;
        }

        $profile->save();

        return response()->json([
            'profile' => $profile->refresh(),
            'message' => 'Onboarding step saved',
        ]);
    }

    /**
     * POST /api/doctor-profile/gallery — Upload gallery images
     */
    public function uploadGallery(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $request->validate([
            'images'   => 'required|array|max:10',
            'images.*' => 'file|mimes:jpg,jpeg,png,webp|max:5120', // 5MB each
        ]);

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $gallery = $profile->gallery ?? [];

        foreach ($request->file('images') as $image) {
            $path = $image->store('doctor-gallery/' . $user->id, 'public');
            $gallery[] = '/storage/' . $path;
        }

        $profile->update(['gallery' => $gallery]);

        return response()->json([
            'gallery' => $gallery,
            'message' => 'Gallery updated',
        ]);
    }
}
