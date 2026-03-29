<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\ClinicReview;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Helpers\TurkishStr;

class ClinicController extends Controller
{
    /**
     * GET /api/clinics — Public brief list
     */
    public function index(Request $request)
    {
        $clinics = Clinic::active()
            ->when($request->name, function ($q, $v) {
                $q->where(function ($inner) use ($v) {
                    TurkishStr::addNormalizedSearch($inner, 'fullname', $v, 'or');
                    TurkishStr::addNormalizedSearch($inner, 'name', $v, 'or');
                });
            })
            ->select('id', 'name', 'codename', 'fullname', 'avatar', 'address', 'is_verified')
            ->paginate($request->per_page ?? 20);

        return response()->json($clinics);
    }

    /**
     * GET /api/clinics/{codename} — Public detail
     */
    public function show(string $codename)
    {
        $clinic = Clinic::active()->where('codename', $codename)->firstOrFail();
        $clinic->load('owner:id,fullname,avatar');

        // Load doctors with their profiles and specialty (Single Source of Truth)
        $clinic->load(['doctors' => function ($q) {
            $q->where('is_active', true)
              ->select('id', 'fullname', 'avatar', 'clinic_id')
              ->with(['doctorProfile' => function ($q2) {
                  $q2->select('id', 'user_id', 'clinic_id', 'title', 'specialty', 'specialty_id', 'experience_years', 'avg_rating', 'review_count', 'bio', 'languages')
                     ->with('specialtyRelation:id,name');
              }]);
        }]);

        // Social flags for authenticated user
        $authUser = auth('sanctum')->user();
        $clinic->is_favorited = false;
        $clinic->is_followed  = false;
        if ($authUser) {
            $clinic->is_favorited = \App\Models\Favorite::forUser($authUser->id)
                ->where('favoritable_id', $clinic->id)
                ->where('favoritable_type', 'clinic')
                ->exists();
            $clinic->is_followed = \App\Models\DoctorFollow::where('follower_id', $authUser->id)
                ->where('following_id', $clinic->owner_id)
                ->where('is_active', true)
                ->exists();
        }
        $clinic->followers_count = \App\Models\DoctorFollow::where('following_id', $clinic->owner_id)
            ->where('is_active', true)
            ->count();

        return response()->json(['clinic' => $clinic]);
    }

    /**
     * POST /api/clinics — Admin only
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'fullname' => 'required|string|max:255',
            'owner_id' => 'required|uuid|exists:users,id',
            'address' => 'sometimes|string',
            'biography' => 'sometimes|string',
            'map_coordinates' => 'sometimes|array',
            'website' => 'sometimes|url',
        ]);

        $validated['codename'] = Str::slug($validated['name']) . '-' . Str::random(4);
        $validated['avatar'] = 'https://gravatar.com/avatar/' . md5(strtolower($validated['fullname'])) . '?s=200&d=identicon';

        $clinic = DB::transaction(function () use ($validated) {
            $clinic = Clinic::create($validated);

            // Update owner role
            User::where('id', $validated['owner_id'])->update([
                'role_id' => 'clinicOwner',
                'clinic_id' => $clinic->id,
            ]);

            return $clinic;
        });

        return response()->json(['clinic' => $clinic], 201);
    }

    /**
     * PUT /api/clinics/{id} — Clinic owner/admin
     */
    public function update(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $user = $request->user();
        if ($clinic->owner_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'fullname' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|string|url',
            'address' => 'sometimes|string',
            'biography' => 'sometimes|string',
            'map_coordinates' => 'sometimes|array',
            'website' => 'sometimes|url',
        ]);

        $clinic->update($validated);

        return response()->json(['clinic' => $clinic->refresh()]);
    }

    /**
     * GET /api/clinics/{id}/staff — Clinic staff list
     */
    public function staff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $staff = User::active()
            ->where('clinic_id', $clinic->id)
            ->with('doctorProfile:id,user_id,title,specialty,experience_years,onboarding_completed')
            ->select('id', 'fullname', 'email', 'avatar', 'role_id', 'is_verified', 'clinic_id', 'created_at')
            ->paginate($request->per_page ?? 50);

        return response()->json($staff);
    }

    /**
     * POST /api/clinics/{id}/staff — Create a doctor under this clinic
     */
    public function createStaff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $user = $request->user();
        if ($clinic->owner_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'fullname'  => 'required|string|max:255',
            'email'     => 'required|email|max:255',
            'password'  => 'required|string|min:6|max:100',
            'mobile'    => 'nullable|string|max:20',
            // Doctor profile fields (optional)
            'title'     => 'nullable|string|max:255',
            'specialty' => 'nullable|string|max:255',
            'bio'       => 'nullable|string|max:5000',
            'experience_years' => 'nullable|string|max:50',
        ]);

        // Check if email already exists in this clinic
        $exists = User::where('email', $validated['email'])->where('clinic_id', $clinic->id)->exists();
        if ($exists) {
            return response()->json(['message' => 'A user with this email already exists in this clinic.'], 422);
        }

        $doctor = DB::transaction(function () use ($validated, $clinic) {
            $doctor = User::create([
                'fullname'       => $validated['fullname'],
                'email'          => $validated['email'],
                'password'       => bcrypt($validated['password']),
                'mobile'         => $validated['mobile'] ?? null,
                'role_id'        => 'doctor',
                'clinic_id'      => $clinic->id,
                'added_by_clinic' => true,
                'is_active'      => true,
                'email_verified' => true, // Clinic-created accounts are pre-verified
            ]);

            // Create doctor profile if any profile fields provided
            $profileFields = array_filter([
                'title'            => $validated['title'] ?? null,
                'specialty'        => $validated['specialty'] ?? null,
                'bio'              => $validated['bio'] ?? null,
                'experience_years' => $validated['experience_years'] ?? null,
            ]);

            if (!empty($profileFields)) {
                $doctor->doctorProfile()->create(array_merge($profileFields, [
                    'onboarding_completed' => false,
                    'onboarding_step'      => 0,
                ]));
            }

            return $doctor;
        });

        return response()->json([
            'doctor'  => $doctor->load('doctorProfile'),
            'message' => 'Doctor account created successfully.',
        ], 201);
    }

    /**
     * GET /api/clinic-onboarding — Get current clinic onboarding state
     */
    public function onboardingProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $clinic = Clinic::where('owner_id', $user->id)->first();

        if (!$clinic) {
            return response()->json(['clinic' => null, 'needs_creation' => true]);
        }

        return response()->json([
            'clinic' => [
                'id'                   => $clinic->id,
                'name'                 => $clinic->getRawOriginal('name') ?? $clinic->name,
                'fullname'             => $clinic->fullname,
                'avatar'               => $clinic->getRawOriginal('avatar'),
                'address'              => $clinic->address,
                'phone'                => $clinic->phone,
                'biography'            => $clinic->biography,
                'map_coordinates'      => $clinic->map_coordinates,
                'specialties'          => $clinic->specialties ?? [],
                'onboarding_step'      => $clinic->onboarding_step ?? 0,
                'onboarding_completed' => $clinic->onboarding_completed ?? false,
                'is_verified'          => $clinic->is_verified,
            ],
            'doctors' => $clinic->doctors()->select('id', 'fullname', 'email', 'is_active')->get(),
        ]);
    }

    /**
     * PUT /api/clinic-onboarding — Update clinic onboarding step
     */
    public function updateOnboarding(Request $request): JsonResponse
    {
        $user = $request->user();
        $step = (int) $request->input('step', 0);

        $clinic = Clinic::where('owner_id', $user->id)->first();

        if ($step === 0) {
            // Step 0: Profile info
            $validated = $request->validate([
                'name'            => 'required|string|max:255',
                'address'         => 'nullable|string|max:500',
                'phone'           => 'nullable|string|max:30',
                'biography'       => 'nullable|string|max:5000',
                'map_coordinates' => 'nullable|array',
            ]);

            $data = array_merge($validated, [
                'fullname'        => $validated['name'],
                'onboarding_step' => max($clinic->onboarding_step ?? 0, 1),
            ]);

            if (!$clinic) {
                $data['owner_id'] = $user->id;
                $data['codename'] = Str::slug($validated['name']) . '-' . Str::random(4);
                $clinic = Clinic::create($data);
                // Link user to clinic
                $user->update(['clinic_id' => $clinic->id]);
            } else {
                $clinic->update($data);
            }
        } elseif ($step === 1) {
            // Step 1: Specialties
            $validated = $request->validate([
                'specialties' => 'nullable|array',
            ]);

            if (!$clinic) {
                return response()->json(['message' => 'Clinic not found. Complete step 0 first.'], 422);
            }

            $clinic->update([
                'specialties'     => $validated['specialties'] ?? [],
                'onboarding_step' => max($clinic->onboarding_step, 2),
            ]);
        } elseif ($step === 2) {
            // Step 2: Team setup (doctors are created via /clinics/{id}/staff)
            if (!$clinic) {
                return response()->json(['message' => 'Clinic not found. Complete step 0 first.'], 422);
            }

            $clinic->update([
                'onboarding_completed' => true,
                'onboarding_step'      => 3,
            ]);

            // Also mark user as onboarding completed
            $user->update(['onboarding_completed' => true]);
        }

        return response()->json([
            'clinic'  => $clinic?->fresh(),
            'message' => 'Onboarding step saved.',
        ]);
    }

    /**
     * PUT /api/clinic-onboarding/logo — Upload clinic logo
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => 'required|image|max:5120']);

        $user = $request->user();
        $clinic = Clinic::where('owner_id', $user->id)->firstOrFail();

        $path = $request->file('logo')->store('clinics/logos', 'public');
        $clinic->update(['avatar' => '/storage/' . $path]);

        return response()->json(['avatar' => '/storage/' . $path, 'message' => 'Logo uploaded.']);
    }

    /**
     * GET /api/clinics/{id}/reviews — Paginated clinic reviews (public)
     */
    public function reviews(Request $request, string $id): JsonResponse
    {
        $clinic = Clinic::active()->findOrFail($id);

        $sortMap = [
            'newest'  => ['created_at', 'desc'],
            'highest' => ['rating', 'desc'],
            'lowest'  => ['rating', 'asc'],
        ];
        $sort = $sortMap[$request->sort ?? 'newest'] ?? $sortMap['newest'];

        $reviews = ClinicReview::where('clinic_id', $clinic->id)
            ->where('is_visible', true)
            ->whereIn('moderation_status', ['approved', 'pending'])
            ->with('patient:id,fullname,avatar')
            ->orderBy($sort[0], $sort[1])
            ->paginate($request->per_page ?? 10);

        return response()->json($reviews);
    }

    /**
     * GET /api/clinics/{id}/review-stats — Aggregated rating stats
     */
    public function reviewStats(string $id): JsonResponse
    {
        $clinic = Clinic::active()->findOrFail($id);

        // Check if authenticated user can review
        $canReview = false;
        $authUser = auth('sanctum')->user();
        if ($authUser && $authUser->role_id === 'patient') {
            $alreadyReviewed = ClinicReview::where('clinic_id', $clinic->id)
                ->where('patient_id', $authUser->id)
                ->exists();

            if (!$alreadyReviewed) {
                // Patient must have a completed appointment at this clinic OR with a doctor belonging to this clinic
                $clinicDoctorIds = User::where('clinic_id', $clinic->id)
                    ->where('role_id', 'doctor')
                    ->pluck('id');

                $hasCompletedAppointment = Appointment::where('patient_id', $authUser->id)
                    ->where('status', 'completed')
                    ->where(function ($q) use ($clinic, $clinicDoctorIds) {
                        $q->where('clinic_id', $clinic->id)
                          ->orWhereIn('doctor_id', $clinicDoctorIds);
                    })
                    ->exists();

                $canReview = $hasCompletedAppointment;
            }
        }

        return response()->json([
            'average_rating' => $clinic->avg_rating,
            'review_count'   => $clinic->review_count ?? 0,
            'can_review'     => $canReview,
        ]);
    }

    /**
     * POST /api/clinics/{id}/reviews — Submit a review (auth required, completed appointment check)
     */
    public function submitReview(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'rating'         => 'required|integer|min:1|max:5',
            'comment'        => 'required|string|min:10|max:2000',
            'treatment_type' => 'nullable|string|max:255',
        ]);

        $clinic = Clinic::active()->findOrFail($id);
        $patient = $request->user();

        // Only patients allowed
        if ($patient->role_id !== 'patient') {
            abort(403, 'Only patients can submit reviews.');
        }

        // Gatekeeper: completed appointment at clinic OR with one of the clinic's doctors
        $clinicDoctorIds = User::where('clinic_id', $clinic->id)
            ->where('role_id', 'doctor')
            ->pluck('id');

        $hasCompletedAppointment = Appointment::where('patient_id', $patient->id)
            ->where('status', 'completed')
            ->where(function ($q) use ($clinic, $clinicDoctorIds) {
                $q->where('clinic_id', $clinic->id)
                  ->orWhereIn('doctor_id', $clinicDoctorIds);
            })
            ->exists();

        if (!$hasCompletedAppointment) {
            abort(403, 'You can only review a clinic after a completed appointment.');
        }

        // Duplicate check
        $existing = ClinicReview::where('clinic_id', $clinic->id)
            ->where('patient_id', $patient->id)
            ->exists();
        if ($existing) {
            abort(409, 'You have already reviewed this clinic.');
        }

        // Flood protection: max one review every 24 hours (across all clinics)
        $recentReview = ClinicReview::where('patient_id', $patient->id)
            ->where('created_at', '>=', now()->subDay())
            ->exists();
        if ($recentReview) {
            abort(429, 'Please wait 24 hours between reviews.');
        }

        // Find the latest completed appointment for this clinic
        $appointment = Appointment::where('patient_id', $patient->id)
            ->where('status', 'completed')
            ->where(function ($q) use ($clinic, $clinicDoctorIds) {
                $q->where('clinic_id', $clinic->id)
                  ->orWhereIn('doctor_id', $clinicDoctorIds);
            })
            ->latest()
            ->first();

        $review = ClinicReview::create([
            'clinic_id'         => $clinic->id,
            'patient_id'        => $patient->id,
            'appointment_id'    => $appointment?->id,
            'rating'            => $request->rating,
            'comment'           => $request->comment,
            'treatment_type'    => $request->treatment_type,
            'is_verified'       => true,
            'moderation_status' => 'pending',
        ]);

        // Recalculate aggregated rating
        ClinicReview::recalculateAggregatedRating($clinic->id);

        return response()->json(['review' => $review->load('patient:id,fullname,avatar')], 201);
    }
}
