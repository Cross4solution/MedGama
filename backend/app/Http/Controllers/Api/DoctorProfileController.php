<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'operating_hours'      => 'nullable|array',
            'whatsapp'             => 'nullable|string|max:50',
            'social_links'         => 'nullable|array',
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
            $result = ImageService::optimiseGalleryImage($image, 'doctor-gallery/' . $user->id);
            $gallery[] = $result['url'];
        }

        $profile->update(['gallery' => $gallery]);

        return response()->json([
            'gallery' => $gallery,
            'message' => 'Gallery updated',
        ]);
    }

    /**
     * DELETE /api/doctor-profile/gallery — Remove a gallery image
     */
    public function deleteGalleryImage(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $request->validate(['url' => 'required|string']);

        $profile = DoctorProfile::where('user_id', $user->id)->firstOrFail();
        $gallery = $profile->gallery ?? [];
        $url = $request->input('url');

        // Remove from gallery array
        $gallery = array_values(array_filter($gallery, fn($img) => $img !== $url));

        // Delete file from storage
        $path = str_replace('/storage/', '', $url);
        Storage::disk('public')->delete($path);

        $profile->update(['gallery' => $gallery]);

        return response()->json([
            'gallery' => $gallery,
            'message' => 'Image removed',
        ]);
    }

    /**
     * PUT /api/doctor-profile/gallery/reorder — Reorder gallery images
     */
    public function reorderGallery(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $request->validate(['gallery' => 'required|array']);

        $profile = DoctorProfile::where('user_id', $user->id)->firstOrFail();
        $profile->update(['gallery' => $request->input('gallery')]);

        return response()->json([
            'gallery' => $profile->gallery,
            'message' => 'Gallery reordered',
        ]);
    }

    /**
     * PUT /api/doctor-profile/operating-hours — Update weekly operating hours
     */
    public function updateOperatingHours(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $request->validate([
            'operating_hours'              => 'required|array|min:7|max:7',
            'operating_hours.*.day'        => 'required|string',
            'operating_hours.*.is_closed'  => 'required|boolean',
            'operating_hours.*.open'       => 'nullable|string|max:5',
            'operating_hours.*.close'      => 'nullable|string|max:5',
            'operating_hours.*.breaks'     => 'nullable|array',
            'operating_hours.*.breaks.*.start' => 'required_with:operating_hours.*.breaks|string|max:5',
            'operating_hours.*.breaks.*.end'   => 'required_with:operating_hours.*.breaks|string|max:5',
        ]);

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $profile->update(['operating_hours' => $request->input('operating_hours')]);

        return response()->json([
            'operating_hours' => $profile->operating_hours,
            'message' => 'Operating hours updated',
        ]);
    }

    /**
     * PUT /api/doctor-profile/services — Update services with duration & price
     */
    public function updateServices(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $request->validate([
            'services'                    => 'required|array',
            'services.*.name'             => 'required|string|max:255',
            'services.*.description'      => 'nullable|string|max:1000',
            'services.*.duration_minutes' => 'nullable|integer|min:5|max:480',
            'services.*.price'            => 'nullable|numeric|min:0',
            'services.*.currency'         => 'nullable|string|max:10',
        ]);

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $profile->update(['services' => $request->input('services')]);

        return response()->json([
            'services' => $profile->services,
            'message' => 'Services updated',
        ]);
    }

    // ══════════════════════════════════════════════
    //  VERIFICATION DOCUMENTS (Doc §8.3)
    // ══════════════════════════════════════════════

    /**
     * GET /api/doctor-profile/verification — List my verification requests
     */
    public function verificationRequests(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $requests = \App\Models\VerificationRequest::where('doctor_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['verification_requests' => $requests]);
    }

    /**
     * POST /api/doctor-profile/verification — Submit a new verification document
     */
    public function submitVerification(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $request->validate([
            'document'       => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240', // 10MB
            'document_type'  => 'required|string|in:diploma,specialty_certificate,clinic_license,id_card,other',
            'document_label' => 'nullable|string|max:255',
            'notes'          => 'nullable|string|max:2000',
        ]);

        $file = $request->file('document');
        $path = $file->store('verification-documents/' . $user->id, 'local');

        $vr = \App\Models\VerificationRequest::create([
            'doctor_id'      => $user->id,
            'document_type'  => $request->input('document_type'),
            'document_label' => $request->input('document_label', $file->getClientOriginalName()),
            'file_path'      => $path,
            'file_name'      => $file->getClientOriginalName(),
            'mime_type'      => $file->getMimeType(),
            'notes'          => $request->input('notes'),
            'status'         => 'pending',
        ]);

        return response()->json([
            'message' => 'Verification document submitted for review.',
            'verification_request' => $vr,
        ], 201);
    }

    /**
     * PUT /api/doctor-profile/social — Update social & contact info
     */
    public function updateSocial(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $validated = $request->validate([
            'phone'           => 'nullable|string|max:50',
            'whatsapp'        => 'nullable|string|max:50',
            'website'         => 'nullable|string|max:255',
            'address'         => 'nullable|string|max:500',
            'map_coordinates' => 'nullable|array',
            'map_coordinates.lat' => 'nullable|numeric',
            'map_coordinates.lng' => 'nullable|numeric',
            'social_links'    => 'nullable|array',
            'social_links.instagram' => 'nullable|string|max:255',
            'social_links.facebook'  => 'nullable|string|max:255',
            'social_links.twitter'   => 'nullable|string|max:255',
            'social_links.linkedin'  => 'nullable|string|max:255',
            'social_links.youtube'   => 'nullable|string|max:255',
            'social_links.tiktok'    => 'nullable|string|max:255',
        ]);

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $profile->update($validated);

        return response()->json([
            'profile' => $profile->refresh()->only([
                'phone', 'whatsapp', 'website', 'address', 'map_coordinates', 'social_links',
            ]),
            'message' => 'Social & contact info updated',
        ]);
    }
}
