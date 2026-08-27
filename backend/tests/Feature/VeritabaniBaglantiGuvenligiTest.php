<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Veritabanı bağlantısı üretimde SSL'siz kalamaz.
 *
 * `DB_SSL_DISABLED` yerel için var: macOS'ta ikinci adım her zaman bir CA
 * bulduğu için sürücü bağlantıyı SSL'e zorluyor, yerel MySQL ise kendi
 * imzaladığı sertifikayı kullanıyor. Anahtar olmadan test paketi ÜRETİM
 * SÜRÜCÜSÜNE karşı hiç koşturulamıyordu — ve SQLite'ta yeşil görünüp canlıda
 * 500 veren bir SQL hatası tam bu yüzden gözden kaçmıştı.
 *
 * Ama anahtar üretimde de dinleniyordu. Yanlış konmuş tek bir ortam değişkeni,
 * hasta verisini taşıyan bağlantıyı şifresiz hâle getirebilirdi — hiçbir uyarı
 * çıkmadan, çünkü bağlantı çalışmaya devam eder.
 *
 * Kolaylık yerinde; üretimde sessizce yok sayılıyor.
 */
class VeritabaniBaglantiGuvenligiTest extends TestCase
{
    /** Yapılandırma dosyasındaki koşul, ortam değerlerinden bağımsız okunuyor. */
    private function ssKapatmaKosulu(): string
    {
        return (string) file_get_contents(config_path('database.php'));
    }

    public function test_ssl_kapatma_anahtari_uretim_disiyla_sinirli(): void
    {
        $this->assertMatchesRegularExpression(
            "/env\('DB_SSL_DISABLED'\)\s*&&\s*env\('APP_ENV'\)\s*!==\s*'production'/",
            $this->ssKapatmaKosulu(),
            'DB_SSL_DISABLED üretimde de dinleniyor: tek bir ortam değişkeni '
            . 'hasta verisini şifresiz bağlantıya taşır',
        );
    }

    public function test_ssl_kapatma_yolu_hala_var(): void
    {
        // Aşırı kilitlemek de bir kusur olurdu: bu anahtar olmadan paket
        // üretim sürücüsüne karşı koşturulamıyor.
        $this->assertStringContainsString(
            "DB_SSL_DISABLED",
            $this->ssKapatmaKosulu(),
            'yerel kaçış yolu tümüyle kaldırılmış: MySQL koşusu imkânsızlaşır',
        );
    }

    public function test_mysql_baglantisi_ssl_ca_ariyor(): void
    {
        $this->assertStringContainsString(
            'MYSQL_ATTR_SSL_CA',
            $this->ssKapatmaKosulu(),
            'SSL kök sertifikası yapılandırmadan düşmüş',
        );
    }
}
