<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Doğrulama sınırı, sütun genişliğinden büyük olamaz.
 *
 * Kural `string|max:500` deyip sütunun `varchar(255)` olması, aradaki her
 * girdiyi bir 500 hatasına çeviriyor: kullanıcı formu doğru dolduruyor,
 * doğrulamayı geçiyor, sonra veritabanı `Data too long` diyor. Suçlanacak bir
 * "geçersiz girdi" bile yok — kabul edilebilir denen şey saklanamıyor.
 *
 * Dört alanda böyleydi: `announcements.link_url`, `clinics.address`,
 * `doctor_profiles.address`, `leads.lost_reason`. Sütunlar doğrulamaya
 * hizalandı; kural daraltılmadı, çünkü üç yüz karakterlik bir adres meşru.
 *
 * SQLite'ta atlanıyor: varchar uzunluğunu uygulamadığı için orada ölçülecek
 * bir şey yok — bu sınıfın yerelde görünmemesinin sebebi de bu.
 * (Bkz. docs/YEREL-TEST.md — gerçek sürücüye karşı koşma.)
 */
class DogrulamaSutunHizasiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Atlama mesajı komutu SÖYLEMELİ.
     *
     * Bu ölçütler varsayılan koşuda atlanıyor ve tam olarak bu yüzden bir
     * üretim hatası aylarca görülmedi. Atlandığını okuyan kişi, nasıl
     * koşturacağını da okumalı — yoksa atlama sessizlikle aynı şey.
     */
    private const KOMUT = "MySQL'e karşı koşun: DB_CONNECTION=mysql DB_DATABASE=medagama_test DB_SSL_DISABLED=1 php artisan test (bkz. docs/YEREL-TEST.md)";

    /** [tablo, sütun, doğrulamanın izin verdiği uzunluk] */
    private const HIZA = [
        ['announcements',   'link_url',    500],
        ['clinics',         'address',     500],
        ['doctor_profiles', 'address',     500],
        ['leads',           'lost_reason', 500],
    ];

    public function test_sutun_dogrulamanin_izin_verdigi_kadar_genis(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped(
                'Sütun genişliği yalnız gerçek sürücüde ölçülebilir; SQLite varchar sınırını uygulamıyor. ' . self::KOMUT
            );
        }

        $dar = [];

        foreach (self::HIZA as [$tablo, $sutun, $gereken]) {
            // `SHOW COLUMNS ... LIKE ?` bağlı parametre kabul etmiyor;
            // information_schema hem parametre alıyor hem sürücüden bağımsız.
            $bilgi = DB::select(
                'SELECT COLUMN_TYPE AS tur FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [$tablo, $sutun],
            );

            if (!$bilgi) {
                $dar[] = "{$tablo}.{$sutun} yok";
                continue;
            }

            $tur = $bilgi[0]->tur;

            // TEXT ve üstü zaten yeterli.
            if (!preg_match('/^varchar\((\d+)\)/i', $tur, $m)) {
                continue;
            }

            if ((int) $m[1] < $gereken) {
                $dar[] = "{$tablo}.{$sutun} = {$tur}, doğrulama {$gereken} kabul ediyor";
            }
        }

        $this->assertSame(
            [],
            $dar,
            'doğrulamadan geçen bir girdi sütuna sığmıyor: kullanıcı doğru doldurup 500 alır',
        );
    }

    public function test_uzun_deger_gercekten_saklanabiliyor(): void
    {
        // Şema okumak yetmez: değerin YAZILABİLDİĞİNİ görmek gerekiyor.
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Yalnız gerçek sürücüde anlamlı. ' . self::KOMUT);
        }

        $sahip = \App\Models\User::factory()->clinicOwner()->create();
        $uzunAdres = str_repeat('Mahalle Caddesi No 12 Daire 3, ', 15); // ~450 karakter

        $klinik = \App\Models\Clinic::factory()->create([
            'owner_id' => $sahip->id,
            'address'  => $uzunAdres,
        ]);

        $this->assertSame(
            $uzunAdres,
            $klinik->fresh()->address,
            'uzun adres kırpılarak ya da hata vererek kaydedildi',
        );
    }
}
