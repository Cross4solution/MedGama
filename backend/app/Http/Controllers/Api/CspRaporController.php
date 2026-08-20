<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Tarayıcının içerik güvenlik politikası (CSP) ihlal raporlarını toplar.
 *
 * Politika önce "izle ama engelleme" modunda açılıyor: tarayıcı hiçbir şeyi
 * kesmiyor, yalnızca "şu politika olsaydı şunu engellerdim" diye rapor
 * gönderiyor. Böylece kuralı gerçekten devreye almadan önce meşru bir şeyi
 * kırıp kırmayacağını görüyoruz.
 *
 * Uç herkese açık olmak ZORUNDA (tarayıcı kimlik göndermez), bu yüzden kötüye
 * kullanıma karşı dar tutuldu:
 *  • Hız sınırı rotada uygulanıyor.
 *  • Yalnızca birkaç alan loglanıyor — gövdenin tamamı değil.
 *  • Alanlar kırpılıyor; log şişirme saldırısı işe yaramasın.
 */
class CspRaporController extends Controller
{
    /** Log'a yazılan her alanın en fazla uzunluğu. */
    private const SINIR = 300;

    public function store(Request $request): JsonResponse
    {
        // Tarayıcılar iki farklı biçim gönderiyor: eski `report-uri`
        // {"csp-report": {...}} ve yeni `report-to` [{"body": {...}}].
        $govde = $request->json()->all();
        $rapor = $govde['csp-report'] ?? ($govde[0]['body'] ?? $govde);

        if (!is_array($rapor)) {
            return response()->json(['ok' => true]);
        }

        $kis = static fn ($deger) => is_scalar($deger)
            ? mb_substr((string) $deger, 0, self::SINIR)
            : null;

        Log::warning('CSP ihlali', array_filter([
            'ihlal_eden'  => $kis($rapor['blocked-uri'] ?? $rapor['blockedURL'] ?? null),
            'kural'       => $kis($rapor['violated-directive'] ?? $rapor['effectiveDirective'] ?? null),
            'sayfa'       => $kis($rapor['document-uri'] ?? $rapor['documentURL'] ?? null),
            'satir'       => $kis($rapor['line-number'] ?? $rapor['lineNumber'] ?? null),
        ]));

        // Tarayıcı yanıtla ilgilenmiyor; gövdesiz 204 en ucuzu.
        return response()->json(['ok' => true], 204);
    }
}
