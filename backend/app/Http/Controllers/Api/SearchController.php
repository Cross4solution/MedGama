<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $term = mb_strtolower($q);

        // ── Doctors: search users with role=doctor, LEFT JOIN doctor_profiles for extras ──
        $doctors = User::query()
            ->leftJoin('doctor_profiles', 'users.id', '=', 'doctor_profiles.user_id')
            ->where('users.is_active', true)
            ->where('users.role_id', 'doctor')
            ->where(function ($query) use ($term) {
                $query->whereRaw('LOWER(users.fullname) LIKE ?', ["%{$term}%"])
                      ->orWhereRaw('LOWER(COALESCE(doctor_profiles.specialty, \'\')) LIKE ?', ["%{$term}%"]);
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
                $query->whereRaw('LOWER(fullname) LIKE ?', ["%{$term}%"])
                      ->orWhereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
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

        return response()->json([
            'doctors' => $doctors,
            'clinics' => $clinics,
        ]);
    }
}
