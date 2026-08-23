<?php

namespace App\Http\Middleware;

use App\Models\ConsentRecord;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sağlık verisi rızası geri çekildiyse işleme durur.
 *
 * Rıza kayıtları tutuluyordu ama HİÇBİR YERDE sorgulanmıyordu. Ölçülen dizi,
 * kayıt akışından geçmiş gerçek bir kullanıcı için:
 *
 *     DELETE /api/consents/health_data_processing   → 200  "Consent withdrawn."
 *     PUT    /api/auth/profile/medical-history      → 200  (yazmaya devam)
 *     GET    /api/patient-documents                 → 200  (okumaya devam)
 *
 * Yani kullanıcı sağlık verisinin işlenmesine rızasını geri çekiyor, sistem
 * geri çekildiğini onaylıyor ve işlemeye aynen devam ediyor. KVKK ve GDPR
 * md.7(3) rızanın geri alınmasını vermek kadar kolay olmaya ve İŞLEMEYİ
 * DURDURMAYA bağlıyor. Hata sessiz: her uç 200 dönüyor.
 *
 * KAPSAM — bu ara katman yalnızca kullanıcının KENDİ sağlık verisine
 * dokunduğu uçlarda. Randevu ve klinik tarafı akışları kapsam dışı: orada
 * işlemenin dayanağı sözleşmenin ifası ve engellemek hizmeti durdurur.
 * Hangi özelliklerin "sağlık verisi işleme" sayılacağı hukuki bir karar;
 * burada uygulamanın kendi tanımı esas alındı (config/consents.php:
 * health_data_processing hem `required` hem `revocable` — yani geri çekmek
 * hesabı kapatmak DEĞİL, işlemeyi durdurmak anlamına geliyor).
 *
 * KAYDI OLMAYAN kullanıcı engellenmiyor: rıza sisteminden önce açılmış
 * hesaplarda kayıt yok ve onları kilitlemek, geri çekmemiş insanları
 * cezalandırmak olurdu. Ölçüt açık bir GERİ ÇEKME kaydı.
 */
class EnsureHealthDataConsent
{
    public const TUR = 'health_data_processing';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && self::geriCekilmisMi($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Sağlık verilerinizin işlenmesine verdiğiniz rızayı geri çektiniz. '
                    . 'Bu bölümü kullanabilmek için rızanızı yeniden vermeniz gerekiyor.',
                'code'    => 'HEALTH_CONSENT_WITHDRAWN',
            ], 403);
        }

        return $next($request);
    }

    /** Açık bir geri çekme var ve yerine geçen aktif bir onay yok. */
    public static function geriCekilmisMi(User $user): bool
    {
        $kayitlar = ConsentRecord::where('user_id', $user->id)
            ->where('type', self::TUR)
            ->get(['granted_at', 'revoked_at']);

        if ($kayitlar->isEmpty()) {
            return false; // rıza sisteminden önceki hesap
        }

        $aktifVar = $kayitlar->contains(fn ($k) => $k->revoked_at === null);

        return !$aktifVar;
    }
}
