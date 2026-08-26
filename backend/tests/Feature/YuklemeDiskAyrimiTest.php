<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Hangi yüklemenin hangi diske gittiği, tek satırlık bir değişiklikle kayabilir.
 *
 * Bu depoda iki disk var ve aralarındaki fark gizlilik:
 *
 *   public → `storage/app/public`, entrypoint'in kurduğu `public/storage` bağı
 *            üzerinden nginx tarafından DOĞRUDAN servis edilir. Kimlik yok,
 *            süre yok, erişim denetimi yok.
 *   local  → `EncryptedFileStorage` ile şifrelenerek yazılır, yalnız yetkili
 *            uçtan ya da kısa süreli imzalı bağlantıyla okunur.
 *
 * İkisi de doğru; yanlış olan, sağlık verisi taşıyan bir yüklemenin birincisine
 * düşmesi. Bu tam olarak iki kez oldu: canlı sohbet ekleri ve iletişim mesajı
 * ekleri. İkisi de 201 dönüyordu, hiçbir test kırmızı yanmıyordu, dosya
 * adresini eline geçiren herkes indirebiliyordu.
 *
 * Bu ölçüt bir davranışı değil, bir SINIRI tutuyor: aşağıdaki dosyalar
 * herkese açık diske yazamaz. Herkese açık içerik (klinik profili, galeri,
 * MedStream gönderileri) bilinçli olarak listede yok.
 */
class YuklemeDiskAyrimiTest extends TestCase
{
    /** Sağlık verisi taşıyabilen yükleme yolları. */
    private const OZEL_KALMALI = [
        'app/Services/ChatService.php',
        'app/Http/Controllers/Api/ContactMessageController.php',
        'app/Http/Controllers/Api/PatientDocumentController.php',
    ];

    /**
     * Yorumsuz kaynak.
     *
     * Bu dosyalardaki açıklamalar "eskiden herkese açık diske yazılıyordu"
     * diyor, yani aranan metni KENDİLERİ taşıyor. Ham metinde arayan bir ölçüt
     * doğru koda kırmızı yanar — bu çalışmada aynı tuzağa yedi kez düşüldü.
     */
    private function yorumsuz(string $goreliYol): string
    {
        $tam = base_path($goreliYol);

        $this->assertFileExists($tam, "$goreliYol bulunamadı — bu ölçüt güncellenmeli");

        $ham = (string) preg_replace('#/\*[\s\S]*?\*/#', '', (string) file_get_contents($tam));

        return implode("\n", array_filter(
            explode("\n", $ham),
            static fn ($satir) => !preg_match('#^\s*//#', $satir),
        ));
    }

    public function test_saglik_verisi_tasiyan_yuklemeler_herkese_acik_diske_yazmiyor(): void
    {
        foreach (self::OZEL_KALMALI as $dosya) {
            $kaynak = $this->yorumsuz($dosya);

            // Yazma biçimleri: `storeAs(..., 'public')`, `store(..., 'public')`,
            // `Storage::disk('public')->put/putFileAs/path`.
            $this->assertDoesNotMatchRegularExpression(
                "#->store(As)?\([^)]*'public'\s*\)#",
                $kaynak,
                "$dosya herkese açık diske dosya yazıyor",
            );

            $this->assertDoesNotMatchRegularExpression(
                "#disk\('public'\)->(put|putFile|putFileAs|path)\(#",
                $kaynak,
                "$dosya herkese açık diske dosya yazıyor",
            );
        }
    }

    public function test_ozel_disk_hizmeti_gercekten_kullaniliyor(): void
    {
        // Yukarıdaki olumsuz ölçüt tek başına yeterli değil: dosya hiç yükleme
        // yapmaz hale gelirse de yeşil kalır.
        foreach (self::OZEL_KALMALI as $dosya) {
            $this->assertStringContainsString(
                'EncryptedFileStorage',
                $this->yorumsuz($dosya),
                "$dosya artık şifreli depolamayı kullanmıyor",
            );
        }
    }

    public function test_dogrulama_belgeleri_ozel_diskte(): void
    {
        // Diploma ve lisans belgesi — hekim profilindeki sertifika GÖRSELİNDEN
        // ayrı. İkincisi bilerek herkese açık (hastaya gösteriliyor), birincisi
        // yalnız yönetici incelemesi için.
        $this->assertMatchesRegularExpression(
            "#store\('verification-documents/[^,]*,\s*'local'\)#",
            $this->yorumsuz('app/Http/Controllers/Api/DoctorProfileController.php'),
            'hekim doğrulama belgeleri artık özel diske yazılmıyor',
        );

        $this->assertMatchesRegularExpression(
            "#->store\([^)]*'local'\)#",
            $this->yorumsuz('app/Http/Controllers/Api/ClinicVerificationController.php'),
            'klinik doğrulama belgeleri artık özel diske yazılmıyor',
        );
    }

    public function test_imzali_ek_rotalari_yerinde(): void
    {
        // Özel diske yazmak tek başına yetmiyor; dosyanın yetkili sahibine
        // ULAŞABİLMESİ de gerekiyor. Bu rotalar kalkarsa ekler okunamaz hale
        // gelir ve birileri "geçici olarak" public diske geri döner.
        $rotalar = $this->yorumsuz('routes/api.php');

        foreach ([
            'chat.attachment.file',
            'contact-messages.attachment',
            'messages.attachment.file',
            'messages.attachment.thumb',
        ] as $ad) {
            $this->assertStringContainsString($ad, $rotalar, "imzalı ek rotası yok: $ad");
        }

        // Sayı sabit tutuluyor: bir rota imzasız bırakılırsa ad hâlâ dosyada
        // olur ve yukarıdaki döngü bunu göremez.
        $this->assertSame(
            4,
            preg_match_all("#->middleware\('signed'\)#", $rotalar),
            'imzalı ek rotalarının sayısı değişmiş — biri imzasız kalmış olabilir',
        );
    }
}
