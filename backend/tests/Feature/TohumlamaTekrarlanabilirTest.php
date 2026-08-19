<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\MedStreamPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * Tohumlamanın ikinci kez çalıştırılabilmesi.
 *
 * Canlı demo verisi bir kez yaratılıp bir daha tazelenemedi: örnek gönderiler
 * düz create() ile ekleniyordu, yani yeniden tohumlamak akışı kopyalarla
 * dolduracaktı. Sonuç olarak gönderiler 100 günü aştı ve son 30 günü gösteren
 * "en çok etkileşim" sekmesi boş kaldı.
 *
 * Bu testler yeniden tohumlamanın güvenli olduğunu sabitliyor — demo verisini
 * tazelemek artık veri silmeyi gerektirmiyor.
 */
class TohumlamaTekrarlanabilirTest extends TestCase
{
    use RefreshDatabase;

    public function test_ikinci_tohumlama_gonderi_cogaltmiyor(): void
    {
        Artisan::call('db:seed', ['--force' => true]);
        $ilk = MedStreamPost::count();
        $this->assertGreaterThan(0, $ilk, 'İlk tohumlama hiç gönderi üretmedi.');

        Artisan::call('db:seed', ['--force' => true]);
        $ikinci = MedStreamPost::count();

        $this->assertSame(
            $ilk,
            $ikinci,
            "Yeniden tohumlama gönderi sayısını {$ilk} → {$ikinci} yaptı; akış kopyalarla dolar.",
        );
    }

    public function test_yeniden_tohumlama_tarihleri_tazeliyor(): void
    {
        Artisan::call('db:seed', ['--force' => true]);

        // Gönderileri geçmişe it: canlıdaki 100 günlük veriyi taklit ediyor.
        MedStreamPost::query()->update(['created_at' => now()->subDays(120)]);
        $this->assertSame(0, MedStreamPost::where('created_at', '>=', now()->subDays(30))->count());

        // Gerçekte yapılacak olan bu: tohumlamayı yeniden çalıştırmak.
        Artisan::call('db:seed', ['--force' => true]);

        // "En çok etkileşim" sekmesi son 30 günü gösteriyor; tazeleme sonrası
        // orada gönderi bulunmalı.
        $this->assertGreaterThan(
            0,
            MedStreamPost::where('created_at', '>=', now()->subDays(30))->count(),
            'Yeniden tohumlama tarihleri güncellemedi — "top" sekmesi boş kalmaya devam eder.',
        );
    }

    public function test_klinik_adi_yeniden_tohumlamayla_duzeliyor(): void
    {
        Artisan::call('db:seed', ['--force' => true]);

        $klinik = Clinic::where('codename', 'medagama-clinic')->first();
        $this->assertNotNull($klinik, 'Tohumlamada medagama-clinic yok.');

        // Canlıdaki eski yanlış yazımı taklit et.
        $klinik->update(['fullname' => 'MedaGama Sağlık Merkezi']);

        Artisan::call('db:seed', ['--force' => true]);

        // Klinikler updateOrCreate ile ekleniyor; yeniden tohumlamak adı
        // düzeltmeli ve marka yazımı her yerde "Medagama" olmalı.
        $this->assertSame('Medagama Sağlık Merkezi', $klinik->fresh()->fullname);
    }

}
