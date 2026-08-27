<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Üretimde dosyalar KALICI bir yerde durmalı.
 *
 * Ölçüldüğünde durum şuydu: `render.yaml` içinde disk tanımı yok
 * (`disk:` / `mountPath` hiç geçmiyor), `FILESYSTEM_DISK` ayarlanmamış — yani
 * yapılandırma varsayılanı `local` geçerli — ve S3 yapılandırılmamış.
 *
 * Render'da diski olmayan bir web servisinin dosya sistemi GEÇİCİ: her
 * dağıtımda, her yeniden başlatmada kapsayıcı sıfırdan kuruluyor. `local`
 * diske yazılan her şey o anda yok oluyor.
 *
 * Kaybolan şeyler:
 *
 *   • hasta tıbbi belgeleri (`patient_documents`)
 *   • sohbet ve iletişim mesajı ekleri
 *   • hekim diploma ve lisans belgeleri (`verification_requests`)
 *
 * Veritabanı satırları duruyor, dosyalar gidiyor. Yani sistem belgenin VAR
 * olduğunu söylemeye devam ediyor, açmaya çalışınca bulunamıyor. Sessiz ve
 * geri dönüşü olmayan bir kayıp — hasta belgesini yeniden yükleyemez, hekim
 * diplomasını yeniden göndermek zorunda kalır.
 *
 * Bu bir YEDEKLEME eksiği değil: yedeklenecek şey zaten kalıcı değil.
 *
 * Depolama sağlamak bir hesap işi (S3 kovası ya da Render kalıcı diski) ve
 * kodla çözülemiyor. Bu ölçütün işi, o iş yapılmadan canlıya çıkılmasını
 * fark edilmez olmaktan çıkarmak.
 */
class KaliciDepolamaTest extends TestCase
{
    private function renderYapilandirmasi(): string
    {
        $yol = base_path('../render.yaml');

        if (!is_file($yol)) {
            $this->markTestSkipped('render.yaml bulunamadı.');
        }

        return (string) file_get_contents($yol);
    }

    public function test_uretimde_dosyalar_gecici_diske_yazilmiyor(): void
    {
        $yapilandirma = $this->renderYapilandirmasi();

        // Yorumlar bu kuralı ANLATIYOR; eşleşmemeleri için ayıklanıyor.
        $yapilandirma = preg_replace('/^\s*#.*$/m', '', $yapilandirma);

        $kaliciDisk = (bool) preg_match('/^\s*disk:/m', $yapilandirma)
            || str_contains($yapilandirma, 'mountPath');

        $s3 = preg_match("/key:\s*FILESYSTEM_DISK[\s\S]{0,80}value:\s*['\"]?s3/", $yapilandirma) === 1;

        $this->assertTrue(
            $kaliciDisk || $s3,
            "Üretimde dosyalar GEÇİCİ diske yazılıyor.\n\n"
            . "render.yaml'da ne kalıcı disk (`disk:` / `mountPath`) ne de\n"
            . "`FILESYSTEM_DISK=s3` var. Render'da diski olmayan bir servisin\n"
            . "dosya sistemi her dağıtımda sıfırlanır: hasta belgeleri, sohbet\n"
            . "ekleri ve hekim diplomaları kaybolur. Veritabanı satırları kalır,\n"
            . "dosyalar gitmiş olur.\n\n"
            . "Çözüm bir hesap işi: S3 kovası (FILESYSTEM_DISK=s3) ya da\n"
            . "render.yaml'a kalıcı disk eklemek.",
        );
    }

    public function test_sifreli_depolama_yapilandirilabilir_bir_diske_bakiyor(): void
    {
        /*
         * `EncryptedFileStorage` diski `private const DISK = 'local'` ile
         * SABİT tutuyor. S3'e geçilse bile hasta belgeleri yine yerel diske
         * yazılırdı — yani depolama satın alınır, sorun sürerdi.
         *
         * Bu ölçüt sabitin yapılandırmadan okunmasını istiyor.
         */
        $kaynak = (string) file_get_contents(app_path('Services/EncryptedFileStorage.php'));
        $kaynak = preg_replace('#//.*$#m', '', $kaynak);

        $this->assertDoesNotMatchRegularExpression(
            "/const DISK\s*=\s*'local'/",
            $kaynak,
            'Şifreli depolama diski koda gömülü: S3 ayarlansa bile hasta '
            . 'belgeleri geçici diske yazılmaya devam eder.',
        );
    }
}
