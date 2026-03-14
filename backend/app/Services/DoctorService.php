<?php

namespace App\Services;

use App\Models\User;
use App\Models\Specialty;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
                'doctorProfile:id,user_id,title,specialty,sub_specialties,experience_years,address,online_consultation,bio,languages,prices',
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
                $q->where('fullname', 'ilike', "%{$search}%")
                  ->orWhereHas('doctorProfile', function ($pq) use ($search) {
                      $pq->where('specialty', 'ilike', "%{$search}%");
                  });

                // Also search translatable specialty names in the specialties table
                $matchingSpecialtyIds = $this->findSpecialtyIdsByText($search);
                if ($matchingSpecialtyIds) {
                    $q->orWhereHas('doctorProfile', function ($pq) use ($matchingSpecialtyIds, $search) {
                        // specialty field on profile may contain code or name
                        $pq->where(function ($inner) use ($matchingSpecialtyIds, $search) {
                            foreach ($matchingSpecialtyIds as $code) {
                                $inner->orWhere('specialty', 'ilike', "%{$code}%");
                            }
                        });
                    });
                }
            });
        }

        // ── Specialty ID (UUID from specialties table) ──
        if ($specId = $filters['specialty_id'] ?? null) {
            $spec = Specialty::find($specId);
            if ($spec) {
                // Match on specialty code or any translation of the name
                $translations = $spec->getTranslations('name');
                $query->whereHas('doctorProfile', function ($pq) use ($spec, $translations) {
                    $pq->where(function ($inner) use ($spec, $translations) {
                        $inner->where('specialty', 'ilike', "%{$spec->code}%");
                        foreach ($translations as $val) {
                            if ($val) $inner->orWhere('specialty', 'ilike', "%{$val}%");
                        }
                    });
                });
            }
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
     * Get single doctor with full profile.
     */
    public function getDoctor(string $id): ?User
    {
        return User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->with(['doctorProfile', 'clinic:id,name,codename,avatar,address'])
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified', 'gender')
            ->find($id);
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
     * Returns array of specialty codes.
     */
    private function findSpecialtyIdsByText(string $search): array
    {
        $locale = app()->getLocale();
        $fallback = config('app.fallback_locale', 'en');

        return Specialty::active()
            ->get()
            ->filter(function ($spec) use ($search, $locale, $fallback) {
                $translations = $spec->getTranslations('name');
                foreach ($translations as $val) {
                    if ($val && stripos($val, $search) !== false) {
                        return true;
                    }
                }
                return false;
            })
            ->pluck('code')
            ->toArray();
    }
}
