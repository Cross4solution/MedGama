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
     *
     * Query params:
     *  - name      : klinik adı (mevcut davranış, korunur)
     *  - city      : şehir adı (klinik adres metninde aranır) — Round 4 landing
     *  - city_id   : cities.id (UUID) — şehir adına çözülüp adreste aranır
     *  - specialty : uzmanlık adı/kodu — klinik specialties JSON'unda VEYA
     *                kliniğin doktorlarının uzmanlığında (whereHas) aranır
     *  - per_page  : sayfalama (default 20)
     */
    public function index(Request $request)
    {
        // city_id verilmişse şehir adını cities tablosundan çöz (adres metni eşleştirmesi için)
        $cityName = trim((string) $request->city);
        if (!$cityName && $request->city_id) {
            $cityModel = \App\Models\City::find($request->city_id);
            // name translatable → çözülmüş string döner
            $cityName = $cityModel?->name ?? '';
        }

        $specialty = trim((string) $request->specialty);

        $clinics = Clinic::active()
            // ── İsim (mevcut davranış, korunur) ──
            ->when($request->name, function ($q, $v) {
                $q->where(function ($inner) use ($v) {
                    TurkishStr::addNormalizedSearch($inner, 'fullname', $v, 'or');
                    TurkishStr::addNormalizedSearch($inner, 'name', $v, 'or');
                });
            })
            // ── Şehir: klinik adres metninde ara (klinikte city_id kolonu yok) ──
            ->when($cityName, function ($q, $v) {
                TurkishStr::addNormalizedSearch($q, 'address', $v, 'and');
            })
            // ── Uzmanlık: klinik specialties JSON'unda VEYA doktorlarının uzmanlığında ──
            ->when($specialty, function ($q, $v) {
                $q->where(function ($inner) use ($v) {
                    // 1) Klinik specialties serbest metin JSON alanı
                    TurkishStr::addNormalizedSearch($inner, 'specialties', $v, 'or');
                    // 2) Kliniğin doktorlarının uzmanlığı (serbest metin + FK)
                    $inner->orWhereHas('doctors.doctorProfile', function ($pq) use ($v) {
                        $pq->where(function ($sq) use ($v) {
                            TurkishStr::addNormalizedSearch($sq, 'specialty', $v, 'and');
                            $sq->orWhereHas('specialtyRelation', function ($rel) use ($v) {
                                TurkishStr::addNormalizedSearch($rel, 'name', $v, 'and');
                            });
                        });
                    });
                });
            })
            // ── Tedavi tag'i: kesin eşleşme (bu tedaviyi sunan klinikler) ──
            ->when($request->treatment_tag_id, function ($q, $v) {
                $q->whereHas('treatmentTags', fn ($tq) => $tq->where('treatment_tags.id', $v));
            })
            // brief response: specialties eklendi (frontend join'e gerek kalmaz)
            ->select('id', 'name', 'codename', 'fullname', 'avatar', 'address', 'specialties', 'is_verified', 'avg_rating', 'review_count')
            ->paginate($request->per_page ?? 20);

        return response()->json($clinics);
    }

    /**
     * GET /api/clinics/{codename} — Public detail
     */
    public function show(string $codename)
    {
        \Log::info('ClinicController@show called with codename: ' . $codename);
        $clinic = Clinic::active()->where('codename', $codename)->first();
        
        if (!$clinic) {
            \Log::error('Clinic not found with codename: ' . $codename);
            return response()->json(['error' => 'Clinic not found'], 404);
        }
        
        \Log::info('Clinic found: ' . $clinic->id . ' - ' . $clinic->fullname);
        $clinic->load('owner:id,fullname,avatar');

        // Load doctors with their profiles and specialty (Single Source of Truth)
        $clinic->load(['doctors' => function ($q) {
            $q->where('is_active', true)
              ->select('id', 'fullname', 'avatar', 'clinic_id')
              ->with(['doctorProfile' => function ($q2) {
                  $q2->select('id', 'user_id', 'clinic_id', 'title', 'slug', 'specialty', 'specialty_id', 'experience_years', 'avg_rating', 'review_count', 'bio', 'languages')
                     ->with('specialtyRelation:id,name');
              }]);
        }]);

        // Load accreditations
        $clinic->load('accreditations');

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
            'avatar' => 'sometimes|image|max:10240', // 10MB file upload
            'address' => 'sometimes|string',
            'biography' => 'sometimes|string',
            'map_coordinates' => 'sometimes|array',
            'website' => 'sometimes|url',
            'background_image' => 'sometimes|image|max:10240', // 10MB file upload
            'latitude' => 'sometimes|nullable|numeric|between:-90,90',
            'longitude' => 'sometimes|nullable|numeric|between:-180,180',
            // multipart/form-data ile JSON string olarak gelir → aşağıda decode edilir
            'price_ranges' => 'sometimes|nullable|string',
            'packages' => 'sometimes|nullable|string',
        ]);

        // ── Handle Avatar Upload ──
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('clinics', 'public');
            $clinic->avatar = "/storage/$avatarPath";
        }

        // ── Handle Background Image Upload ──
        if ($request->hasFile('background_image')) {
            $bgPath = $request->file('background_image')->store('clinics', 'public');
            $clinic->background_image = "/storage/$bgPath";
        }

        // ── Update other fields ──
        if (isset($validated['fullname'])) $clinic->fullname = $validated['fullname'];
        if (isset($validated['address'])) $clinic->address = $validated['address'];
        if (isset($validated['biography'])) $clinic->biography = $validated['biography'];
        if (isset($validated['website'])) $clinic->website = $validated['website'];
        if (isset($validated['map_coordinates'])) $clinic->map_coordinates = $validated['map_coordinates'];

        // Konum koordinatları (yakındaki-update / harita için) — map_coordinates ile senkron
        if (array_key_exists('latitude', $validated) && $validated['latitude'] !== null) {
            $clinic->latitude = $validated['latitude'];
        }
        if (array_key_exists('longitude', $validated) && $validated['longitude'] !== null) {
            $clinic->longitude = $validated['longitude'];
        }
        if (isset($clinic->latitude) && isset($clinic->longitude)) {
            $clinic->map_coordinates = ['lat' => (float) $clinic->latitude, 'lng' => (float) $clinic->longitude];
        }

        // Fiyat aralıkları + paketler (multipart → JSON string → array)
        if (array_key_exists('price_ranges', $validated)) {
            $decoded = json_decode($validated['price_ranges'] ?? '[]', true);
            $clinic->price_ranges = is_array($decoded) ? array_values($decoded) : [];
        }
        if (array_key_exists('packages', $validated)) {
            $decoded = json_decode($validated['packages'] ?? '[]', true);
            $clinic->packages = is_array($decoded) ? array_values($decoded) : [];
        }

        $clinic->save();

        return response()->json(['clinic' => $clinic->refresh()]);
    }

    /**
     * GET /api/clinics/{id}/staff — Clinic staff list
     */
    public function staff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $staff = User::active()
            ->where(function ($q) use ($clinic) {
                $q->where('clinic_id', $clinic->id)
                  ->orWhereHas('clinics', fn ($c) => $c->where('clinics.id', $clinic->id));
            })
            ->with('doctorProfile:id,user_id,title,specialty,experience_years,onboarding_completed')
            ->select('id', 'fullname', 'email', 'avatar', 'role_id', 'is_verified', 'clinic_id', 'codename', 'created_at')
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
                'latitude'             => $clinic->latitude,
                'longitude'            => $clinic->longitude,
                'phone'                => $clinic->phone,
                'biography'            => $clinic->biography,
                'map_coordinates'      => $clinic->map_coordinates,
                'specialties'          => $clinic->specialties ?? [],
                'certifications'       => $clinic->certifications ?? [],
                'treatment_tag_ids'    => $clinic->treatmentTags()->pluck('treatment_tags.id'),
                'onboarding_step'      => $clinic->onboarding_step ?? 0,
                'onboarding_completed' => $clinic->onboarding_completed ?? false,
                'is_verified'          => $clinic->is_verified,
            ],
            'doctors' => $clinic->doctors()
                ->select('users.id', 'users.fullname', 'users.email', 'users.is_active', 'users.avatar', 'users.mobile', 'users.country')
                ->with(['doctorProfile' => fn($q) => $q->select('user_id', 'specialty', 'title')])
                ->get(),
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
                'latitude'        => 'nullable|numeric|between:-90,90',
                'longitude'       => 'nullable|numeric|between:-180,180',
                'phone'           => 'nullable|string|max:30',
                'biography'       => 'nullable|string|max:5000',
                'map_coordinates' => 'nullable|array',
                'certifications'              => 'nullable|array',
                'certifications.*.name'       => 'required_with:certifications|string',
                'certifications.*.year'       => 'nullable|string',
                'certifications.*.image'      => 'nullable|string',
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
            // Step 1: Specialties + offered treatments
            $validated = $request->validate([
                'specialties'        => 'nullable|array',
                'treatment_tag_ids'  => 'nullable|array',
                'treatment_tag_ids.*' => 'uuid',
            ]);

            if (!$clinic) {
                return response()->json(['message' => 'Clinic not found. Complete step 0 first.'], 422);
            }

            $clinic->update([
                'specialties'     => $validated['specialties'] ?? [],
                'onboarding_step' => max($clinic->onboarding_step, 2),
            ]);

            if ($request->has('treatment_tag_ids')) {
                $clinic->treatmentTags()->sync($validated['treatment_tag_ids'] ?? []);
            }
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
        // Onaylı Review Sistemi — appointment_id ZORUNLU
        $request->validate([
            'rating'         => 'required|integer|min:1|max:5',
            'comment'        => 'required|string|min:10|max:2000',
            'treatment_type' => 'nullable|string|max:255',
            'appointment_id' => 'required|uuid|exists:appointments,id',
        ]);

        $clinic = Clinic::active()->findOrFail($id);
        $patient = $request->user();

        // Sadece hastalar yorum yapabilir
        if ($patient->role_id !== 'patient') {
            abort(403, 'Yalnızca hastalar yorum yapabilir.');
        }

        // Randevuyu fetch et ve sahiplik / durum kontrolleri
        $appointment = Appointment::find($request->input('appointment_id'));
        if (!$appointment || $appointment->patient_id !== $patient->id) {
            abort(403, 'Bu randevu için yorum yapamazsınız.');
        }

        // Klinik eşleşmesi: doğrudan clinic_id ya da klinik doktorlarından biri
        $clinicDoctorIds = User::where('clinic_id', $clinic->id)
            ->where('role_id', 'doctor')
            ->pluck('id')
            ->toArray();

        $belongsToClinic = ($appointment->clinic_id === $clinic->id)
            || in_array($appointment->doctor_id, $clinicDoctorIds, true);

        if (!$belongsToClinic) {
            abort(403, 'Bu randevu seçilen kliniğe ait değil.');
        }

        if ($appointment->status !== 'completed') {
            abort(403, 'Randevu henüz tamamlanmadı.');
        }

        // Hizmet kategorisi türetme — appointment_type üzerinden
        $treatmentType = $request->input('treatment_type') ?: $appointment->appointment_type;
        if ($request->filled('treatment_type')
            && $request->input('treatment_type') !== $appointment->appointment_type) {
            abort(403, 'Bu hizmet kategorisinde yorum yapma hakkınız yok.');
        }

        // Çift yorum kontrolü
        $existing = ClinicReview::where('clinic_id', $clinic->id)
            ->where('patient_id', $patient->id)
            ->exists();
        if ($existing) {
            abort(409, 'Bu klinik için zaten yorum yaptınız.');
        }

        // Flood protection — 24 saat
        $recentReview = ClinicReview::where('patient_id', $patient->id)
            ->where('created_at', '>=', now()->subDay())
            ->exists();
        if ($recentReview) {
            abort(429, 'Yorumlar arasında 24 saat beklemelisiniz.');
        }

        $review = ClinicReview::create([
            'clinic_id'         => $clinic->id,
            'patient_id'        => $patient->id,
            'appointment_id'    => $appointment->id,
            'rating'            => $request->rating,
            'comment'           => $request->comment,
            'treatment_type'    => $treatmentType,
            'is_verified'       => true,
            'moderation_status' => 'pending',
        ]);

        // Toplam puanı yeniden hesapla
        ClinicReview::recalculateAggregatedRating($clinic->id);

        return response()->json(['review' => $review->load('patient:id,fullname,avatar')], 201);
    }

    /**
     * GET /api/clinics/reviewable-appointments
     * Hastanın yorum yapabileceği (completed + henüz yorumlanmamış) klinik randevuları.
     */
    public function reviewableAppointments(Request $request): JsonResponse
    {
        $patient = $request->user();

        // Bu hasta tarafından zaten yorumlanmış klinikleri dışla
        $reviewedClinicIds = ClinicReview::where('patient_id', $patient->id)
            ->pluck('clinic_id')
            ->toArray();

        // Klinik doktor eşleştirmesi için tüm klinik->doktor map'i
        $appointments = Appointment::where('patient_id', $patient->id)
            ->where('status', 'completed')
            ->with([
                'clinic:id,fullname,name,avatar,codename',
                'doctor:id,fullname,clinic_id',
            ])
            ->orderByDesc('appointment_date')
            ->limit(20)
            ->get();

        $result = $appointments->map(function ($appt) use ($reviewedClinicIds) {
            // Klinik referansı: doğrudan clinic_id veya doktorun clinic_id'si
            $clinicId = $appt->clinic_id ?: $appt->doctor?->clinic_id;
            if (!$clinicId || in_array($clinicId, $reviewedClinicIds, true)) {
                return null;
            }

            $clinic = $appt->clinic ?: Clinic::find($clinicId);

            return [
                'appointment_id'   => $appt->id,
                'clinic_id'        => $clinicId,
                'clinic_name'      => $clinic?->fullname ?? $clinic?->name,
                'clinic_avatar'    => $clinic?->avatar,
                'clinic_codename'  => $clinic?->codename,
                'appointment_date' => $appt->appointment_date,
                'appointment_type' => $appt->appointment_type,
                'treatment_type'   => $appt->appointment_type,
            ];
        })->filter()->values();

        return response()->json(['data' => $result]);
    }
}
