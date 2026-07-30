<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeoIpResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeoController extends Controller
{
    public function __construct(private GeoIpResolver $geo)
    {
    }

    /**
     * GET /geo/ip-country  (public)
     * Misafir ana sayfası için IP'den ülke (+varsa eyalet). GPS yok.
     */
    public function ipCountry(Request $request): JsonResponse
    {
        return response()->json($this->geo->resolve($request));
    }

    /**
     * GET /geo/check  (auth)
     * Cookie/otomatik girişte "IP ülkesi/eyaleti kayıtlı son konumdan farklı mı?"
     * Frontend: manuel login → her zaman sor (bunu çağırmaz); cookie login → bunu
     * çağırır, changed=true ise hassas konum ister.
     */
    public function check(Request $request): JsonResponse
    {
        $user = $request->user();
        $ip = $this->geo->resolve($request);

        $storedCountry = $user->country ? strtoupper($user->country) : null;
        $storedState = $user->state ?: null;

        // Eyaleti olan ülkelerde (ör. US) eyalet bazında; diğerlerinde ülke bazında.
        $usesState = in_array($ip['country'], ['US', 'CA', 'AU', 'BR', 'IN'], true);

        $changed = false;
        if ($ip['country'] !== null && $storedCountry !== null) {
            $changed = $ip['country'] !== $storedCountry;
            if (!$changed && $usesState && $ip['state'] && $storedState) {
                $changed = strcasecmp($ip['state'], $storedState) !== 0;
            }
        }

        return response()->json([
            'ip_country'     => $ip['country'],
            'ip_state'       => $ip['state'],
            'stored_country' => $storedCountry,
            'stored_state'   => $storedState,
            'uses_state'     => $usesState,
            'changed'        => $changed,
            // Kayıtlı konum hiç yoksa yine sormak gerekir
            'should_ask'     => $changed || $storedCountry === null,
        ]);
    }

    /**
     * POST /geo/location  (auth)
     * Hassas konum izni verildiğinde veya profil/manuel seçimde kaydet.
     */
    public function saveLocation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'country'   => 'nullable|string|max:5',
            'state'     => 'nullable|string|max:100',
            'latitude'  => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $user = $request->user();
        $user->fill([
            'country'             => isset($data['country']) ? strtoupper($data['country']) : $user->country,
            'state'               => $data['state'] ?? $user->state,
            'latitude'            => $data['latitude'] ?? $user->latitude,
            'longitude'           => $data['longitude'] ?? $user->longitude,
            'location_updated_at' => now(),
        ]);
        $user->save();

        return response()->json([
            'country'   => $user->country,
            'state'     => $user->state,
            'latitude'  => $user->latitude,
            'longitude' => $user->longitude,
        ]);
    }
}
