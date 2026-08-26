<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Teslim engelleri — dağınık yorumların tek kapısı.
 *
 * Kod tabanında kendi yorumunda "teslimden önce kaldırılmalı" diyen beş şey
 * var. Hepsi meşru sebeplerle eklenmiş (barındırma ortamında kabuk erişimi
 * yok, CRM'i denemek için şifresiz giriş gerekiyordu) ama hiçbiri yayında
 * kalmamalı. Yorum olarak dağınık durdukları sürece unutulmaya açıklar.
 *
 * Bu ölçüt onları tek yerde topluyor ve HER BİRİNİN ÜRETİMDE KAPALI OLDUĞUNU
 * söylüyor. Kaldırma kararı bu ölçütün işi değil — bugün kapalı olduklarını
 * garanti etmek işi.
 *
 * Not: `render.yaml`'de beyan edilmeyen bir değişkenin değerini Render paneli
 * belirliyor ve dosyaya bakan kimse bunu göremiyor. Bu yüzden ölçüt yalnız
 * config varsayılanına değil, ÜRETİM DOSYASINA da bakıyor. Dördü de aynı
 * hatayla başlamıştı: karar doğruydu, yazılı değildi.
 */
class TeslimHazirligiTest extends TestCase
{
    /** env anahtarı → üretimde olması gereken değer. */
    private const KAPALI_KALMALI = [
        // Şifresiz demo girişi: bağlantıyı bilen herkes demo hesabına girer.
        'DEMO_LOGIN_ENABLED'      => 'false',
        // Canlı altyazı: görüşme sesini ABD'deki üçüncü tarafa akıtır.
        'TELEHEALTH_RECORDING'    => 'false',
        // Teşhis başlığı: sorgu sayısı, süre ve istisna sınıfı adı.
        'TIMING_HEADER'           => 'false',
        // Hata ayıklama: yığın izi ve ortam değişkenleri yanıta düşer.
        'APP_DEBUG'               => 'false',
    ];

    private function render(): string
    {
        $yol = base_path('../render.yaml');

        $this->assertFileExists($yol, 'render.yaml bulunamadı — bu ölçüt güncellenmeli');

        return (string) file_get_contents($yol);
    }

    public function test_uretim_dosyasi_her_bayragi_acikca_kapatiyor(): void
    {
        $render = $this->render();
        $eksik = [];

        foreach (self::KAPALI_KALMALI as $anahtar => $deger) {
            if (!preg_match("/key:\s*{$anahtar}\s*\n\s*value:\s*{$deger}/", $render)) {
                $eksik[] = $anahtar;
            }
        }

        $this->assertSame(
            [],
            $eksik,
            'üretim dosyası bu bayrakları açıkça kapatmıyor: beyan edilmeyen değişkenin değerini panel belirler',
        );
    }

    public function test_kaldirilmasi_gerekenler_hala_isaretli(): void
    {
        // İşaretin kendisi teslim listesinin kaynağı. Biri işareti silip kodu
        // bırakırsa, o parça sessizce kalıcı hâle gelir.
        // Üç teşhis denetleyicisi bu listedeydi; kaldırıldılar
        // (bkz. TeshisUclariTest). Geriye şifresiz demo girişi kaldı.
        $isaretliler = [
            'app/Http/Controllers/Api/DemoLoginController.php',
        ];

        foreach ($isaretliler as $dosya) {
            $this->assertMatchesRegularExpression(
                '/[Tt]eslimden [öo]nce/u',
                (string) file_get_contents(base_path($dosya)),
                "$dosya teslim işaretini kaybetmiş: ya kaldırıldı ya da sessizce kalıcı oldu",
            );
        }
    }
}
