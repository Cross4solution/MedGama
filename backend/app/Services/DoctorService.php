<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\DoctorReview;
use App\Models\Favorite;
use App\Models\Specialty;
use App\Models\User;
use App\Notifications\NewReviewNotification;
use App\Notifications\ReviewResponseNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Helpers\TurkishStr;

class DoctorService
{
    /**
     * List doctors with advanced filtering (Doc §3 / §8.3).
     *
     * Supported filters:
     *  - search_text : fullname OR translatable specialty name (ILIKE)
     *  - specialty_id: exact specialty UUID match on doctor_profiles
     *  - city_id     : exact city UUID on users table
     *  - language    : JSON-contains check on doctor_profiles.languages
     *  - min_rating  : minimum average_rating (future-proof, stored on doctor_profiles)
     *  - gender      : male | female
     *  - online_only : boolean — only doctors with online_consultation = true
     *  - clinic_id   : exact clinic UUID
     *  - per_page    : pagination size (default 20)
     */
    public function listDoctors(array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->where('role_id', 'doctor')
            ->where('is_active', true)
            ->with([
                'doctorProfile:id,user_id,clinic_id,title,specialty,specialty_id,sub_specialties,experience_years,address,online_consultation,bio,languages,prices',
                'doctorProfile.specialtyRelation:id,name',
                'clinic:id,name,codename,avatar',
            ])
            ->select([
                'id', 'fullname', 'avatar', 'email', 'city_id',
                'country_id', 'clinic_id', 'is_verified', 'gender',
            ]);

        // Legacy compat: map old param names
        if (empty($filters['search_text']) && !empty($filters['search'])) {
            $filters['search_text'] = $filters['search'];
        }

        // ── Free-text search (name OR specialty translations) ──
        if ($search = trim($filters['search_text'] ?? '')) {
            $query->where(function ($q) use ($search) {
                TurkishStr::addNormalizedSearch($q, 'fullname', $search, 'or');
                $q->orWhereHas('doctorProfile', function ($pq) use ($search) {
                    TurkishStr::addNormalizedSearch($pq, 'specialty', $search, 'or');
                });

                // Also search by specialty_id FK (Single Source of Truth)
                $matchingSpecIds = $this->findSpecialtyIdsByText($search);
                if ($matchingSpecIds) {
                    $q->orWhereHas('doctorProfile', function ($pq) use ($matchingSpecIds) {
                        $pq->whereIn('specialty_id', $matchingSpecIds);
                    });
                }
            });
        }

        // ── Specialty ID (UUID — Single Source of Truth via FK) ──
        if ($specId = $filters['specialty_id'] ?? null) {
            $query->whereHas('doctorProfile', function ($pq) use ($specId) {
                $pq->where('specialty_id', $specId);
            });
        }

        // ── City ──
        if ($cityId = $filters['city_id'] ?? null) {
            $query->where('city_id', $cityId);
        }

        // ── Language spoken by doctor ──
        if ($lang = $filters['language'] ?? null) {
            $query->whereHas('doctorProfile', function ($pq) use ($lang) {
                // languages is stored as JSON array, e.g. ["en","tr","de"]
                $pq->whereJsonContains('languages', $lang);
            });
        }

        // ── Minimum rating ──
        if ($minRating = $filters['min_rating'] ?? null) {
            $query->whereHas('doctorProfile', function ($pq) use ($minRating) {
                $pq->where('average_rating', '>=', (float) $minRating);
            });
        }

        // ── Gender ──
        if ($gender = $filters['gender'] ?? null) {
            $query->where('gender', $gender);
        }

        // ── Online consultation only ──
        if (!empty($filters['online_only'])) {
            $query->whereHas('doctorProfile', function ($pq) {
                $pq->where('online_consultation', true);
            });
        }

        // ── Clinic ──
        if ($clinicId = $filters['clinic_id'] ?? null) {
            $query->where('clinic_id', $clinicId);
        }

        // ── Verified only ──
        if (isset($filters['verified'])) {
            $query->where('is_verified', filter_var($filters['verified'], FILTER_VALIDATE_BOOLEAN));
        }

        // ── Sorting ──
        $sort = $filters['sort'] ?? 'name';
        match ($sort) {
            'rating'     => $query->orderByDesc('is_verified')->orderBy('fullname'),
            'experience' => $query->orderByDesc('is_verified')->orderBy('fullname'),
            default      => $query->orderByDesc('is_verified')->orderBy('fullname'),
        };

        return $query->paginate((int) ($filters['per_page'] ?? 20));
    }

    /**
     * Get single doctor with full profile + review stats (Doc §3.2).
     */
    public function getDoctor(string $id): ?array
    {
        $doctor = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->with(['doctorProfile', 'doctorProfile.specialtyRelation:id,name', 'clinic:id,name,fullname,codename,avatar,address,is_verified'])
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified', 'gender')
            ->find($id);

        if (!$doctor) return null;

        // Review stats
        $reviews = DoctorReview::where('doctor_id', $id)->visible();
        $reviewCount = $reviews->count();
        $avgRating   = $reviewCount > 0 ? round($reviews->avg('rating'), 1) : null;

        // Upcoming availability summary (next 7 days)
        $upcomingSlots = CalendarSlot::where('doctor_id', $id)
            ->where('is_available', true)
            ->where('slot_date', '>=', now()->toDateString())
            ->where('slot_date', '<=', now()->addDays(7)->toDateString())
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->limit(10)
            ->get(['id', 'slot_date', 'start_time', 'duration_minutes']);

        // Completed appointment count
        $completedAppointments = Appointment::where('doctor_id', $id)
            ->where('status', 'completed')
            ->count();

        // Determine social flags for the authenticated user
        $canReview = false;
        $authUser = auth('sanctum')->user();
        if ($authUser && $authUser->role_id === 'patient') {
            $hasCompleted = Appointment::where('patient_id', $authUser->id)
                ->where('doctor_id', $id)
                ->where('status', 'completed')
                ->exists();
            $alreadyReviewed = DoctorReview::where('patient_id', $authUser->id)
                ->where('doctor_id', $id)
                ->exists();
            $canReview = $hasCompleted && !$alreadyReviewed;
        }

        // Favorite & follow flags
        $isFavorited = false;
        $isFollowed  = false;
        if ($authUser) {
            $isFavorited = Favorite::forUser($authUser->id)
                ->where('favoritable_id', $id)
                ->where('favoritable_type', 'doctor')
                ->exists();
            $isFollowed = \App\Models\DoctorFollow::where('follower_id', $authUser->id)
                ->where('following_id', $id)
                ->where('is_active', true)
                ->exists();
        }

        $followersCount = \App\Models\DoctorFollow::where('following_id', $id)
            ->where('is_active', true)
            ->count();

        $doctor->is_favorited    = $isFavorited;
        $doctor->is_followed     = $isFollowed;
        $doctor->followers_count = $followersCount;

        return [
            'doctor' => $doctor,
            'review_stats' => [
                'average_rating' => $avgRating,
                'review_count'   => $reviewCount,
            ],
            'upcoming_slots' => $upcomingSlots,
            'completed_appointments' => $completedAppointments,
            'can_review' => $canReview,
        ];
    }

    /**
     * Get paginated reviews for a doctor (public).
     * Supports sort: newest (default), highest, lowest
     */
    public function getDoctorReviews(string $doctorId, int $perPage = 10, string $sort = 'newest'): LengthAwarePaginator
    {
        $query = DoctorReview::where('doctor_id', $doctorId)
            ->visible()
            ->with(['patient:id,fullname,avatar']);

        match ($sort) {
            'highest' => $query->orderByDesc('rating')->orderByDesc('created_at'),
            'lowest'  => $query->orderBy('rating')->orderByDesc('created_at'),
            default   => $query->orderByDesc('created_at'),
        };

        return $query->paginate($perPage);
    }

    /**
     * Get available slots for a doctor on a specific date range (public).
     */
    public function getDoctorAvailability(string $doctorId, ?string $date = null): array
    {
        $startDate = $date ?: now()->toDateString();
        $endDate   = now()->parse($startDate)->addDays(30)->toDateString();

        $slots = CalendarSlot::where('doctor_id', $doctorId)
            ->where('is_available', true)
            ->whereBetween('slot_date', [$startDate, $endDate])
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->get(['id', 'slot_date', 'start_time', 'duration_minutes']);

        // Group by date
        $grouped = $slots->groupBy(fn($s) => $s->slot_date->format('Y-m-d'))
            ->map(fn($daySlots) => $daySlots->map(fn($s) => [
                'id'         => $s->id,
                'start_time' => $s->start_time,
                'duration'   => $s->duration_minutes,
            ])->values())
            ->toArray();

        return $grouped;
    }

    /**
     * Submit a review for a doctor (authenticated patient).
     * Guarded by DoctorReviewPolicy::create — only patients with completed appointments (Doc §10).
     */
    public function submitReview(User $patient, string $doctorId, array $data): DoctorReview
    {
        // Policy gate: only patients with a completed appointment can review
        $hasCompletedAppointment = Appointment::where('patient_id', $patient->id)
            ->where('doctor_id', $doctorId)
            ->where('status', 'completed')
            ->exists();

        if ($patient->role_id !== 'patient' || !$hasCompletedAppointment) {
            abort(403, 'You can only review a doctor after a completed appointment.');
        }

        // Duplicate check: one review per doctor per patient
        $existing = DoctorReview::where('patient_id', $patient->id)
            ->where('doctor_id', $doctorId)
            ->exists();
        if ($existing) {
            abort(409, 'You have already reviewed this doctor.');
        }

        // Flood protection: max one review every 24 hours (across all doctors)
        $recentReview = DoctorReview::where('patient_id', $patient->id)
            ->where('created_at', '>=', now()->subDay())
            ->exists();
        if ($recentReview) {
            abort(429, 'Please wait 24 hours between reviews.');
        }

        // Use specific appointment_id if provided, otherwise latest completed
        $appointment = isset($data['appointment_id'])
            ? Appointment::where('patient_id', $patient->id)
                ->where('doctor_id', $doctorId)
                ->where('status', 'completed')
                ->where('id', $data['appointment_id'])
                ->firstOrFail()
            : Appointment::where('patient_id', $patient->id)
                ->where('doctor_id', $doctorId)
                ->where('status', 'completed')
                ->latest()
                ->firstOrFail();

        $review = DoctorReview::create([
            'doctor_id'         => $doctorId,
            'patient_id'        => $patient->id,
            'appointment_id'    => $appointment->id,
            'rating'            => $data['rating'],
            'comment'           => $data['comment'] ?? null,
            'treatment_type'    => $data['treatment_type'] ?? null,
            'is_verified'       => true,
            'moderation_status' => 'pending',
        ]);

        // Recalculate aggregated rating
        DoctorReview::recalculateAggregatedRating($doctorId);

        // Notify the doctor about the new review
        $doctor = User::find($doctorId);
        if ($doctor) {
            $doctor->notify(new NewReviewNotification($review->load('patient:id,fullname')));
        }

        return $review;
    }

    /**
     * Doctor responds to a review on their profile (Doc §10).
     */
    public function doctorRespondToReview(User $doctor, string $reviewId, string $response): DoctorReview
    {
        $review = DoctorReview::where('doctor_id', $doctor->id)->findOrFail($reviewId);

        $review->update([
            'doctor_response'    => $response,
            'doctor_response_at' => now(),
        ]);

        $review->refresh()->load('doctor:id,fullname');

        // Notify the patient about the doctor's response
        $patient = User::find($review->patient_id);
        if ($patient) {
            $patient->notify(new ReviewResponseNotification($review));
        }

        return $review;
    }

    /**
     * Get reviews for the authenticated doctor (CRM view).
     */
    public function getDoctorOwnReviews(string $doctorId, int $perPage = 15): LengthAwarePaginator
    {
        return DoctorReview::where('doctor_id', $doctorId)
            ->with(['patient:id,fullname,avatar', 'appointment:id,appointment_date,status'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Get completed appointments that the patient hasn't reviewed yet.
     * Used to show "Rate Your Experience" prompts on the patient dashboard.
     */
    public function getReviewableAppointments(string $patientId): array
    {
        $reviewedDoctorIds = DoctorReview::where('patient_id', $patientId)
            ->pluck('doctor_id')
            ->toArray();

        return Appointment::where('patient_id', $patientId)
            ->where('status', 'completed')
            ->whereNotIn('doctor_id', $reviewedDoctorIds)
            ->with(['doctor:id,fullname,avatar', 'doctor.doctorProfile:user_id,specialty_id', 'doctor.doctorProfile.specialty'])
            ->orderByDesc('appointment_date')
            ->limit(5)
            ->get()
            ->map(fn ($appt) => [
                'appointment_id'   => $appt->id,
                'doctor_id'        => $appt->doctor_id,
                'doctor_name'      => $appt->doctor?->fullname,
                'doctor_avatar'    => $appt->doctor?->avatar,
                'specialty'        => $appt->doctor?->doctorProfile?->specialty?->getTranslation('name', app()->getLocale()),
                'appointment_date' => $appt->appointment_date,
                'appointment_type' => $appt->appointment_type,
            ])
            ->toArray();
    }

    /**
     * "Did you mean?" suggestions when search returns 0 results.
     *
     * Returns:
     *  - similar_specialties : specialties whose name is close to the search text (Levenshtein / partial match)
     *  - popular_doctors     : up to 6 verified doctors in the same city (or globally if no city)
     */
    public function suggestions(array $filters): array
    {
        $locale  = app()->getLocale();
        $fallback = config('app.fallback_locale', 'en');
        $search  = mb_strtolower(trim($filters['search_text'] ?? ''));
        $cityId  = $filters['city_id'] ?? null;

        // ── Similar specialties (fuzzy) ──
        $similarSpecialties = [];
        if ($search) {
            $allSpecs = Specialty::active()->ordered()->get();
            $scored = [];

            foreach ($allSpecs as $spec) {
                $name = mb_strtolower(
                    $spec->getTranslation('name', $locale)
                    ?? $spec->getTranslation('name', $fallback)
                    ?? ''
                );
                if (!$name) continue;

                // Exact substring → highest priority
                if (str_contains($name, $search) || str_contains($search, $name)) {
                    $scored[] = ['spec' => $spec, 'name' => $spec->getTranslation('name', $locale) ?? $spec->getTranslation('name', $fallback), 'dist' => 0];
                    continue;
                }

                // Levenshtein distance (cap at 200 chars for safety)
                $dist = levenshtein(
                    mb_substr($search, 0, 200),
                    mb_substr($name, 0, 200)
                );

                // Also check all translations
                $bestDist = $dist;
                foreach ($spec->getTranslations('name') as $val) {
                    if (!$val) continue;
                    $d = levenshtein(mb_substr($search, 0, 200), mb_substr(mb_strtolower($val), 0, 200));
                    $bestDist = min($bestDist, $d);
                }

                // Only include if reasonably close (threshold: max(4, 40% of search length))
                $threshold = max(4, (int) ceil(mb_strlen($search) * 0.4));
                if ($bestDist <= $threshold) {
                    $scored[] = [
                        'spec' => $spec,
                        'name' => $spec->getTranslation('name', $locale) ?? $spec->getTranslation('name', $fallback),
                        'dist' => $bestDist,
                    ];
                }
            }

            // Sort by distance, take top 5
            usort($scored, fn($a, $b) => $a['dist'] <=> $b['dist']);
            $similarSpecialties = array_map(fn($s) => [
                'id'   => $s['spec']->id,
                'code' => $s['spec']->code,
                'name' => $s['name'],
            ], array_slice($scored, 0, 5));
        }

        // ── Popular doctors in same city (or globally) ──
        $dq = User::query()
            ->where('role_id', 'doctor')
            ->where('is_active', true)
            ->with(['doctorProfile:id,user_id,title,specialty,experience_years,online_consultation,languages'])
            ->select('id', 'fullname', 'avatar', 'city_id', 'is_verified', 'gender');

        if ($cityId) {
            $dq->where('city_id', $cityId);
        }

        $popularDoctors = $dq
            ->orderByDesc('is_verified')
            ->orderBy('fullname')
            ->limit(6)
            ->get();

        return [
            'similar_specialties' => $similarSpecialties,
            'popular_doctors'     => $popularDoctors,
        ];
    }

    /**
     * Search specialties table for matching translatable names.
     * Returns array of specialty UUIDs (Single Source of Truth).
     */
    private function findSpecialtyIdsByText(string $search): array
    {
        return Specialty::active()
            ->get()
            ->filter(function ($spec) use ($search) {
                $translations = $spec->getTranslations('name');
                foreach ($translations as $val) {
                    if ($val && stripos($val, $search) !== false) {
                        return true;
                    }
                }
                return false;
            })
            ->pluck('id')
            ->toArray();
    }
}
