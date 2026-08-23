<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Yazma uçlarında sahiplik denetimi — yapısal tarama.
 *
 * Okuma tarafı beş yapısal testle taranıyor; yazma tarafı (104 uç) aynı
 * sistematiklikle sınanmamıştı. Tarama yapıldı ve SIZINTI BULUNMADI: her uç
 * ya kaynağı kullanıcıya göre daraltıyor, ya rol/politika denetimi yapıyor,
 * ya da yalnızca kullanıcının kendi kaydına dokunuyor.
 *
 * O yüzden bu test bir hatayı değil, bir DURUMU koruyor. Değeri şurada:
 * sahiplik denetimi olmayan yeni bir yazma ucu eklendiğinde test düşer ve
 * geliştirici ya denetimi ekler ya da aşağıdaki listeye gerekçesiyle yazar.
 * Eksik yetkilendirme sessizdir — uç çalışır, sadece herkese çalışır.
 *
 * Tarama KANIT DEĞİL, ELEK: metin eşleşmesi bir denetimin varlığını gösterir,
 * doğruluğunu göstermez. Doğruluk, kaynağa göre yazılmış davranış testlerinde
 * (RandevuListesiKapsamiTest, SohbetErisimSiniriTest, KanalYetkilendirmeTest,
 * MuayeneErisimSiniriTest ve diğerleri).
 */
class YazmaUcuYetkiTaramasiTest extends TestCase
{
    /**
     * Denetim sinyali olmadan geçmesine izin verilen uçlar.
     *
     * Hepsi tek tek okundu. İki grup var:
     *
     *  • KENDİ KAYDI — uç zaten `$request->user()` üzerinden çalışıyor, başka
     *    bir kullanıcının kaydına ulaşacak bir kimlik parametresi yok.
     *    Sahiplik denetimi anlamsız olurdu: kaynak zaten kullanıcının kendisi.
     *
     *  • SERVİSE DEVİR — denetim kontrolörde değil, çağrılan serviste.
     *    (`TicketService::authorizeAdmin`, `DoctorService` sorguyu
     *    `doctor_id`'ye daraltıyor, bildirimler `$user->notifications()`
     *    ilişkisi üzerinden geliyor.)
     */
    private const IZINLI = [
        // Kendi kaydı
        'PUT api/auth/profile',
        'PUT api/auth/profile/password',
        'DELETE api/auth/profile',
        'PUT api/auth/profile/notification-preferences',
        'PUT api/auth/profile/medical-history',
        'DELETE api/consents/{type}',
        'PUT api/doctor-profile',
        'PUT api/doctor-profile/onboarding',
        'PUT api/doctor-profile/operating-hours',
        'PUT api/doctor-profile/services',
        'PUT api/doctor-profile/social',

        // Servise devir — denetim çağrılan sınıfta
        'PUT api/doctors/reviews/{reviewId}/respond',
        'PUT api/notifications/{id}/read',
        'PUT api/notifications/read-all',
        'DELETE api/notifications/{id}',
        'DELETE api/notifications',
        'PATCH api/support/tickets/{ticket}/status',
        'PATCH api/support/tickets/{ticket}/assign',
    ];

    /** Kaynakta bir yetkilendirme/daraltma izi var mı. */
    private function denetimIzi(string $kaynak): bool
    {
        $kaynak = preg_replace('/\s+/', ' ', $kaynak) ?? $kaynak;

        foreach ([
            'authorize', 'Gate::', '->can(', 'abort_if', 'abort_unless',
            'forUser(', 'scopeQuery', 'erisebilir', 'yetki', 'Yetki',
            'kapsam', 'Kapsami', 'isAdmin', 'sahip', 'policy(',
        ] as $desen) {
            if (stripos($kaynak, $desen) !== false) {
                return true;
            }
        }

        // Sorgunun sahiplik sütunuyla daraltılması.
        return (bool) preg_match(
            '/where\(\s*\[?\s*[\'"](user_id|owner_id|patient_id|doctor_id|clinic_id|author_id|uploaded_by|sender_id|assigned_to)/i',
            $kaynak,
        );
    }

    public function test_her_yazma_ucu_ya_denetimli_ya_da_gerekceli(): void
    {
        $supheli = [];
        $tarananSayisi = 0;

        foreach (Route::getRoutes() as $rota) {
            $yontemler = array_intersect(['PUT', 'PATCH', 'DELETE'], $rota->methods());

            if (!$yontemler || !str_contains($rota->getActionName(), '@')) {
                continue;
            }

            [$sinif, $metot] = explode('@', $rota->getActionName());

            if (!class_exists($sinif) || !method_exists($sinif, $metot)) {
                continue;
            }

            $tarananSayisi++;

            // Rol ara katmanı taşıyan uçlar yapısal olarak korunuyor.
            //
            // `crm.access` BURADA SAYILMIYOR — ve bu, taramanın ilk hâlindeki
            // hataydı. O ara katman ABONELİK kanıtlar, SAHİPLİK değil: CRM'i
            // olan her klinik onu geçer. Sayıldığı için sekiz CRM ucu
            // atlanmıştı ve içlerinden ikisi gerçekten açıktı — bir klinik,
            // başka bir kliniğin hastasının süreç aşamasını değiştirebiliyordu.
            $ara = implode(' ', $rota->gatherMiddleware());
            if (str_contains($ara, 'role:')) {
                continue;
            }

            $yansima = new \ReflectionMethod($sinif, $metot);
            $satirlar = file($yansima->getFileName());
            $kaynak = implode('', array_slice(
                $satirlar,
                $yansima->getStartLine() - 1,
                $yansima->getEndLine() - $yansima->getStartLine() + 1,
            ));

            if ($this->denetimIzi($kaynak)) {
                continue;
            }

            $anahtar = implode('|', $yontemler) . ' ' . $rota->uri();

            if (!in_array($anahtar, self::IZINLI, true)) {
                $supheli[] = $anahtar . '  →  ' . class_basename($sinif) . '@' . $metot;
            }
        }

        // Taramanın kendisi çalışmıyorsa test boşuna yeşil olur.
        $this->assertGreaterThan(80, $tarananSayisi, 'yazma ucu taraması çalışmıyor');

        $this->assertSame(
            [],
            $supheli,
            "Sahiplik/yetki denetimi görünmeyen yazma uçları:\n  " . implode("\n  ", $supheli)
            . "\n\nDenetimi ekleyin ya da gerekçesiyle IZINLI listesine yazın.",
        );
    }

    public function test_izinli_listesi_olu_kayit_tasimiyor(): void
    {
        // Uç kaldırıldığında ya da denetim eklendiğinde liste küçülmeli;
        // ölü kayıtlar listeyi zamanla anlamsız bir muafiyet torbasına çevirir.
        $mevcut = [];

        foreach (Route::getRoutes() as $rota) {
            $yontemler = array_intersect(['PUT', 'PATCH', 'DELETE'], $rota->methods());

            if ($yontemler) {
                $mevcut[] = implode('|', $yontemler) . ' ' . $rota->uri();
            }
        }

        $olu = array_values(array_diff(self::IZINLI, $mevcut));

        $this->assertSame([], $olu, 'IZINLI listesinde artık var olmayan uçlar: ' . implode(', ', $olu));
    }
}
