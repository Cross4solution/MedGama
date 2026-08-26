<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Teşhis uçları KALDIRILDI — geri gelmemeli.
 *
 * Beş uç vardı: `/system/init-db`, `/system/init-db-status`,
 * `/system/mail-status`, `/system/mail-preview`, `/system/broadcast-status`.
 * Barındırma ortamında kabuk erişimi olmadığı için eklenmişlerdi ve kendi
 * yorumları "teslimden önce kaldırılmalı" diyordu.
 *
 * İkisi ağırdı: `init-db` göç ve tohum çalıştırıyordu, `mail-preview` her
 * şablondan ÖRNEK E-POSTA GÖNDERİYORDU — anahtarı eline geçiren biri istediği
 * adrese posta attırabilirdi.
 *
 * Bir dönem hepsi tek bir anahtar kontrolüne bağlanmıştı; o kontrolün beş
 * kopyası vardı ve üçü boş anahtarla geçiyordu (cbcf3e0). Kaldırmak, o sınıfı
 * tümüyle ortadan kaldırıyor.
 *
 * Bu ölçüt geri gelmelerini engelliyor: bir teşhis ucu "geçici olarak" yeniden
 * eklenirse kırmızı yanar.
 */
class TeshisUclariTest extends TestCase
{
    private const KALDIRILAN = [
        'system/init-db',
        'system/init-db-status',
        'system/mail-status',
        'system/mail-preview',
        'system/broadcast-status',
    ];

    public function test_kaldirilan_uclar_rota_tablosunda_yok(): void
    {
        $mevcut = collect(Route::getRoutes())->map(fn ($r) => $r->uri())->all();

        $geriGelenler = array_values(array_filter(
            self::KALDIRILAN,
            fn ($uc) => in_array('api/' . $uc, $mevcut, true),
        ));

        $this->assertSame([], $geriGelenler, 'kaldırılan teşhis ucu geri gelmiş');
    }

    public function test_uclar_istege_cevap_vermiyor(): void
    {
        foreach (self::KALDIRILAN as $uc) {
            $this->getJson("/api/{$uc}")->assertStatus(404);
        }
    }

    public function test_denetleyicileri_de_silinmis(): void
    {
        // Rota kaldırılıp sınıf bırakılırsa, biri "zaten duruyor" diye rotayı
        // geri eklemeye eğilimli olur.
        foreach ([
            'Api/MailStatusController.php',
            'Api/MailPreviewController.php',
            'Api/BroadcastStatusController.php',
        ] as $dosya) {
            $this->assertFileDoesNotExist(
                app_path('Http/Controllers/' . $dosya),
                "$dosya hâlâ duruyor",
            );
        }
    }
}
