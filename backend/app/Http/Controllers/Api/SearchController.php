<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\TreatmentTag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Helpers\TurkishStr;

class SearchController extends Controller
{
    /**
     * GET /api/search/live?q=...
     *
     * Real-time autocomplete search across Doctors and Clinics.
     * Returns categorised results with avatar, slug, and specialty info.
     */
    public function live(Request $request): JsonResponse
    {
        $q = trim($request->input('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([
                'doctors' => [],
                'clinics' => [],
            ]);
        }

        $term = $q;

        // ── Doctors: search users with role=doctor, LEFT JOIN doctor_profiles for extras ──
        $doctors = User::query()
            ->leftJoin('doctor_profiles', 'users.id', '=', 'doctor_profiles.user_id')
            ->where('users.is_active', true)
            ->where('users.role_id', 'doctor')
            ->where(function ($query) use ($term) {
                TurkishStr::addNormalizedSearch($query, 'users.fullname', $term, 'or');
                TurkishStr::addNormalizedSearch($query, "COALESCE(doctor_profiles.specialty, '')", $term, 'or');
            })
            ->select([
                'users.id',
                'users.fullname',
                'users.avatar',
                'users.profile_image',
                'users.is_verified',
                'doctor_profiles.specialty',
                'doctor_profiles.title',
            ])
            ->limit(5)
            ->get()
            ->map(fn ($d) => [
                'id'        => $d->id,
                'name'      => $d->fullname,
                'avatar'    => $d->profile_image ?: $d->avatar,
                'slug'      => $d->id,
                'specialty' => $d->specialty,
                'title'     => $d->title,
                'verified'  => (bool) $d->is_verified,
            ]);

        // ── Clinics: search by fullname or name ──
        $clinics = Clinic::active()
            ->where(function ($query) use ($term) {
                TurkishStr::addNormalizedSearch($query, 'fullname', $term, 'or');
                TurkishStr::addNormalizedSearch($query, 'name', $term, 'or');
            })
            ->select(['id', 'name', 'codename', 'fullname', 'avatar', 'address', 'is_verified'])
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'id'       => $c->id,
                'name'     => $c->fullname ?: $c->name,
                'avatar'   => $c->avatar,
                'slug'     => $c->codename ?: $c->id,
                'address'  => $c->address,
                'verified' => (bool) $c->is_verified,
            ]);

        // ── Treatment Tags: match name (JSONB), slug, aliases (JSONB) ──
        $locale   = app()->getLocale();
        $fallback = config('app.fallback_locale', 'en');
        $lowerQ   = mb_strtolower($term);

        $treatments = TreatmentTag::active()
            ->with('specialty:id,code,name')
            ->get()
            ->filter(function ($tag) use ($lowerQ, $locale, $fallback) {
                $name = mb_strtolower($tag->getTranslation('name', $locale) ?? $tag->getTranslation('name', $fallback) ?? '');
                if (str_contains($name, $lowerQ)) return true;
                if (str_contains($tag->slug, $lowerQ)) return true;
                foreach ([$locale, $fallback] as $lang) {
                    foreach (($tag->aliases[$lang] ?? []) as $alias) {
                        if (str_contains(mb_strtolower($alias), $lowerQ)) return true;
                    }
                }
                return false;
            })
            ->take(5)
            ->map(fn ($tag) => [
                'id'             => $tag->id,
                'slug'           => $tag->slug,
                'name'           => $tag->getTranslation('name', $locale) ?? $tag->getTranslation('name', $fallback) ?? '',
                'specialty_id'   => $tag->specialty_id,
                'specialty_code' => $tag->specialty?->code,
                'specialty_name' => $tag->specialty
                    ? ($tag->specialty->getTranslation('name', $locale) ?? $tag->specialty->getTranslation('name', $fallback) ?? '')
                    : '',
            ])
            ->values();

        return response()->json([
            'doctors'    => $doctors,
            'clinics'    => $clinics,
            'treatments' => $treatments,
        ]);
    }
}
