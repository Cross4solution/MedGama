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
     * GET /geo/reverse?lat=&lon=  (public, rate-limited)
     * Koordinat → ülke/şehir adı.
     *
     * UYUM: Bu çeviriyi kasıtlı olarak SUNUCU tarafında yaparız. Böylece hastanın
     * tarayıcısı hiçbir 3. taraf geocode servisine doğrudan bağlanmaz (IP + çerez +
     * konum birlikte dışarı sızmaz). Dışarı giden tek şey çıplak koordinattır ve
     * istek bizim sunucumuzdan, kimlik bilgisi olmadan gider.
     * GEO_REVERSE_URL env'i self-host Nominatim'e çevrilirse 3. taraf tamamen biter.
     */
    public function reverse(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lon' => 'required|numeric|between:-180,180',
        ]);

        $lat = round((float) $data['lat'], 3);   // ~100m: şehir tespiti için fazlasıyla yeterli
        $lon = round((float) $data['lon'], 3);   // veri minimizasyonu (KVKK/GDPR)
        $lang = substr((string) $request->header('Accept-Language', 'en'), 0, 2) ?: 'en';

        $cacheKey = "geo:rev:{$lat}:{$lon}:{$lang}";

        $result = cache()->remember($cacheKey, 86400, function () use ($lat, $lon, $lang) {
            $base = rtrim((string) config('services.geo.reverse_url', 'https://nominatim.openstreetmap.org/reverse'), '/');
            try {
                $res = \Illuminate\Support\Facades\Http::timeout(6)
                    ->withHeaders(['User-Agent' => 'MedaGama/1.0'])
                    ->get($base, [
                        'format' => 'jsonv2',
                        'lat' => $lat,
                        'lon' => $lon,
                        'accept-language' => $lang,
                    ]);
                if (!$res->ok()) {
                    return ['country' => null, 'city' => null];
                }
                $a = $res->json('address') ?? [];
                return [
                    'country' => $a['country'] ?? null,
                    'city'    => $a['city'] ?? $a['town'] ?? $a['province'] ?? $a['state'] ?? null,
                ];
            } catch (\Throwable) {
                return ['country' => null, 'city' => null];
            }
        });

        return response()->json($result);
    }

    /**
     * GET /geo/forward?q=  (public, rate-limited)
     * Şehir adı → koordinat (profilde manuel şehir seçimi için).
     * Ters-geocode ile aynı gerekçe: çağrı sunucudan gider, tarayıcıdan değil.
     */
    public function forward(Request $request): JsonResponse
    {
        $data = $request->validate(['q' => 'required|string|max:120']);
        $q = trim($data['q']);
        $lang = substr((string) $request->header('Accept-Language', 'en'), 0, 2) ?: 'en';

        $result = cache()->remember('geo:fwd:' . md5(mb_strtolower($q) . $lang), 86400, function () use ($q, $lang) {
            $base = rtrim((string) config('services.geo.forward_url', 'https://geocoding-api.open-meteo.com/v1/search'), '/');
            try {
                $res = \Illuminate\Support\Facades\Http::timeout(6)
                    ->withHeaders(['User-Agent' => 'MedaGama/1.0'])
                    ->get($base, ['name' => $q, 'count' => 1, 'language' => $lang]);
                if (!$res->ok()) {
                    return null;
                }
                $hit = $res->json('results.0');
                if (!$hit) {
                    return null;
                }
                return [
                    'latitude'  => $hit['latitude'] ?? null,
                    'longitude' => $hit['longitude'] ?? null,
                    'country'   => $hit['country_code'] ?? null,
                    'state'     => $hit['admin1'] ?? null,
                ];
            } catch (\Throwable) {
                return null;
            }
        });

        return response()->json($result ?? ['latitude' => null, 'longitude' => null]);
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
