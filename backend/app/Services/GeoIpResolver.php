<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * Misafir/oturum için IP → ülke (+ varsa eyalet) tespiti.
 *
 * GPS yok; sadece dağıtım platformunun eklediği coğrafi HTTP başlıklarını okur:
 *   • Vercel:      x-vercel-ip-country, x-vercel-ip-country-region
 *   • Cloudflare:  cf-ipcountry (yalnız ülke)
 *   • Genel:       x-geo-country / x-geo-region (proxy tanımlıysa)
 * Hiçbiri yoksa null döner (ana sayfa ülkesiz/global davranır).
 */
class GeoIpResolver
{
    /** @return array{country: ?string, state: ?string} ISO-2 ülke, eyalet kodu/adı */
    public function resolve(Request $request): array
    {
        $country = $this->firstHeader($request, [
            'x-vercel-ip-country',
            'cf-ipcountry',
            'x-geo-country',
            'cloudfront-viewer-country',
        ]);

        $state = $this->firstHeader($request, [
            'x-vercel-ip-country-region',
            'x-geo-region',
            'cloudfront-viewer-country-region',
        ]);

        // "XX" / "T1" (Tor) gibi anlamsız değerleri ele
        if ($country !== null && (strlen($country) !== 2 || $country === 'XX' || $country === 'T1')) {
            $country = null;
        }

        return [
            'country' => $country ? strtoupper($country) : null,
            'state'   => $state ?: null,
        ];
    }

    private function firstHeader(Request $request, array $keys): ?string
    {
        foreach ($keys as $key) {
            $val = $request->header($key);
            if (is_string($val) && trim($val) !== '') {
                return trim($val);
            }
        }
        return null;
    }
}
