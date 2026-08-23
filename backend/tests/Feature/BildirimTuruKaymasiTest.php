<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Arka ucun ürettiği bildirim türleri ile ön yüzün tanıdıkları.
 *
 * Ön yüz bildirim başlığını türe göre çeviriyor. Tanımadığı bir tür gelirse
 * sunucunun `toArray()` içinde ürettiği SABİT İNGİLİZCE başlığa düşüyor.
 * Yedek çalıştığı için hiçbir şey bozuk görünmüyor — sadece yanlış dilde.
 *
 * Ölçüldü: yedi tür bu durumdaydı. Türk bir kullanıcı, arayüzün geri kalanı
 * Türkçeyken zilde şunları görüyordu:
 *
 *     Password Changed · Invoice Issued · Video Call Starting
 *     Appointment Rescheduled · Welcome · Support Reply
 *
 * Bunlardan ikisi ayrıca zaman ya da güvenlik taşıyor: parola değişikliği
 * bildirimi hesabın ele geçirildiğini fark ettiren şey, görüşme bildirimi de
 * kaçırılmaması gereken bir randevunun başladığını söylüyor.
 *
 * Kayma SESSİZ ve tek yönlü büyüyor: arka uca yeni bir bildirim eklemek tek
 * satır, ön yüz listesine eklemeyi unutmak da öyle.
 */
class BildirimTuruKaymasiTest extends TestCase
{
    /** `toArray()` içinde üretilen tür değerleri. */
    private function arkaUcTurleri(): array
    {
        $turler = [];

        foreach (glob(base_path('app/Notifications/*.php')) as $dosya) {
            preg_match_all("/'type'\s*=>\s*'([a-z_]+)'/", file_get_contents($dosya), $eslesme);

            foreach ($eslesme[1] as $tur) {
                $turler[$tur] = true;
            }
        }

        return array_keys($turler);
    }

    /** Ön yüzün tanıdığı türler (`src/utils/notificationTitle.js`). */
    private function onYuzTurleri(): array
    {
        $dosya = base_path('../src/utils/notificationTitle.js');

        if (!is_file($dosya)) {
            $this->markTestSkipped('src/utils/notificationTitle.js bulunamadı.');
        }

        $metin = file_get_contents($dosya);
        $govde = explode('NOTIFICATION_TYPES = [', $metin)[1] ?? '';
        $govde = explode('];', $govde)[0];

        preg_match_all("/'([a-z_]+)'/", $govde, $eslesme);

        return $eslesme[1];
    }

    public function test_uretilen_her_tur_on_yuzde_taniniyor(): void
    {
        $arka = $this->arkaUcTurleri();
        $on = $this->onYuzTurleri();

        // Tarama çalışmıyorsa test boşuna yeşil olur.
        $this->assertGreaterThan(10, count($arka), 'bildirim türü taraması çalışmıyor');
        $this->assertGreaterThan(10, count($on), 'ön yüz listesi taraması çalışmıyor');

        // `ReviewModerationNotification` türü `'review_' . $action` ile
        // kuruyor; tarama bundan yalnız `review_` önekini görüyor. Gerçek
        // değerler (`review_approved` vb.) ön yüz listesinde var.
        $arka = array_values(array_diff($arka, ['review_']));

        $eksik = array_values(array_diff($arka, $on));

        $this->assertSame(
            [],
            $eksik,
            "Arka uç bu bildirim türlerini üretiyor ama ön yüz tanımıyor.\n"
            . "Kullanıcı, arayüzü kendi dilindeyken sunucunun İngilizce başlığını görür.\n"
            . "`src/utils/notificationTitle.js` listesine ve dil dosyalarına ekleyin:\n  "
            . implode("\n  ", $eksik),
        );
    }

    public function test_on_yuz_listesindeki_her_tur_ceviriye_sahip(): void
    {
        // Listede olup çevirisi olmayan tür, ekranda ham anahtar gösterir.
        $on = $this->onYuzTurleri();

        foreach (['tr', 'en', 'de'] as $dil) {
            $yol = base_path("../src/i18n/locales/{$dil}.json");

            if (!is_file($yol)) {
                $this->markTestSkipped("dil dosyası yok: {$dil}");
            }

            $sozluk = json_decode(file_get_contents($yol), true)['notifications']['type'] ?? [];

            $eksik = array_values(array_filter($on, fn ($t) => !isset($sozluk[$t])));

            $this->assertSame([], $eksik, "{$dil}.json içinde eksik bildirim türü: " . implode(', ', $eksik));
        }
    }

    public function test_onemli_ses_tipleri_gercekten_uretiliyor(): void
    {
        // `notificationSound.js` dört tipi "kaçırılamaz" sayıp yükselen üçlü
        // çalıyor: görüşme başlıyor, randevu iptali, randevu ertelemesi,
        // parola değişikliği.
        //
        // Bu tiplerden biri arka uçta yeniden adlandırılırsa ses katmanı onu
        // artık tanımaz ve SESSİZCE sıradan bildirime düşer — kullanıcı
        // yumuşak çanı duyar ya da sekme öndeyse hiç duymaz. Kaçırılan sesin
        // karşılığı kaçırılan bir muayene.
        $dosya = base_path('../src/utils/notificationSound.js');

        if (!is_file($dosya)) {
            $this->markTestSkipped('notificationSound.js bulunamadı.');
        }

        $metin = file_get_contents($dosya);
        $govde = explode('ONEMLI_TIPLER = new Set([', $metin)[1] ?? '';
        $govde = explode(']);', $govde)[0];

        preg_match_all("/'([a-z_]+)'/", $govde, $eslesme);
        $onemli = $eslesme[1];

        $this->assertGreaterThan(2, count($onemli), 'önemli tip taraması çalışmıyor');

        $arka = array_values(array_diff($this->arkaUcTurleri(), ['review_']));
        $olmayan = array_values(array_diff($onemli, $arka));

        $this->assertSame(
            [],
            $olmayan,
            "`notificationSound.js` arka ucun ÜRETMEDİĞİ tipleri önemli sayıyor:\n  "
            . implode("\n  ", $olmayan)
            . "\n\nO bildirimler sessizce sıradan sese düşer.",
        );
    }
}
