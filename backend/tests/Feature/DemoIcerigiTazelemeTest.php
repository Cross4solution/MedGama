<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * Canlıdaki bayat demo içeriğini tazeleyen göç.
 *
 * Testler canlının o günkü durumunu taklit ediyor: klinik adı "MedaGama"
 * yazımıyla kalmış, gönderiler 104-109 günlük ve "en çok etkileşim" sekmesi
 * (son 30 günü gösterir) bomboş.
 *
 * Göç zaten uygulanmış olarak geldiği için her test önce kendi bozuk durumunu
 * kuruyor, sonra göçü tekrar çalıştırıyor.
 */
class DemoIcerigiTazelemeTest extends TestCase
{
    use RefreshDatabase;

    private const GOC = '2026_08_19_160000_refresh_stale_demo_content';

    private function gocuCalistir(): void
    {
        $sinif = require database_path('migrations/' . self::GOC . '.php');
        $sinif->up();
    }

    public function test_marka_yazimi_duzeliyor(): void
    {
        $klinik = Clinic::factory()->create([
            'name'     => 'MedaGama Sağlık',
            'fullname' => 'MedaGama Sağlık Merkezi',
        ]);

        $this->gocuCalistir();

        $tazelenmis = $klinik->fresh();
        $this->assertSame('Medagama Sağlık', $tazelenmis->name);
        $this->assertSame('Medagama Sağlık Merkezi', $tazelenmis->fullname);
    }

    public function test_dogru_yazilmis_adlar_bozulmuyor(): void
    {
        $klinik = Clinic::factory()->create(['fullname' => 'Medagama Sağlık Merkezi']);
        $baska  = Clinic::factory()->create(['fullname' => 'Elite Dental Kliniği']);

        $this->gocuCalistir();

        $this->assertSame('Medagama Sağlık Merkezi', $klinik->fresh()->fullname);
        $this->assertSame('Elite Dental Kliniği', $baska->fresh()->fullname);
    }

    public function test_bayat_gonderiler_one_kayiyor_ve_top_sekmesi_doluyor(): void
    {
        $yazar = User::factory()->doctor()->create();

        // Canlıdaki tablo: 104-109 gün arası, tamamı 30 günün dışında.
        foreach ([104, 106, 109] as $gun) {
            MedStreamPost::factory()->create([
                'author_id'  => $yazar->id,
                'created_at' => now()->subDays($gun),
            ]);
        }

        $this->assertSame(0, MedStreamPost::where('created_at', '>=', now()->subDays(30))->count());

        $this->gocuCalistir();

        $this->assertSame(
            3,
            MedStreamPost::where('created_at', '>=', now()->subDays(30))->count(),
            '"En çok etkileşim" sekmesi hâlâ boş kalır.',
        );
    }

    public function test_gonderilerin_goreli_sirasi_korunuyor(): void
    {
        $yazar = User::factory()->doctor()->create();

        $eski  = MedStreamPost::factory()->create(['author_id' => $yazar->id, 'created_at' => now()->subDays(109)]);
        $orta  = MedStreamPost::factory()->create(['author_id' => $yazar->id, 'created_at' => now()->subDays(106)]);
        $yeni  = MedStreamPost::factory()->create(['author_id' => $yazar->id, 'created_at' => now()->subDays(104)]);

        $this->gocuCalistir();

        // Hepsi aynı miktarda kaydığı için sıra ve aralar aynı kalmalı;
        // aksi hâlde akış rastgele karışmış görünürdü.
        $this->assertTrue($eski->fresh()->created_at->lt($orta->fresh()->created_at));
        $this->assertTrue($orta->fresh()->created_at->lt($yeni->fresh()->created_at));

        $this->assertSame(
            3 * 24,
            (int) round($eski->fresh()->created_at->diffInHours($orta->fresh()->created_at)),
            'Gönderiler arasındaki boşluk değişti.',
        );
    }

    public function test_guncel_gonderilere_dokunulmuyor(): void
    {
        $yazar = User::factory()->doctor()->create();

        MedStreamPost::factory()->create(['author_id' => $yazar->id, 'created_at' => now()->subDays(109)]);
        $taze = MedStreamPost::factory()->create(['author_id' => $yazar->id, 'created_at' => now()->subDays(3)]);
        $once = $taze->fresh()->created_at;

        $this->gocuCalistir();

        // Sonradan girilmiş gerçek içerik kaydırılmamalı.
        $this->assertSame(
            $once->toDateTimeString(),
            $taze->fresh()->created_at->toDateTimeString(),
            'Güncel gönderinin tarihi değiştirildi.',
        );
    }

    public function test_bayat_icerik_yoksa_hicbir_sey_degismiyor(): void
    {
        $yazar = User::factory()->doctor()->create();
        $taze  = MedStreamPost::factory()->create(['author_id' => $yazar->id, 'created_at' => now()->subDays(5)]);
        $once  = $taze->fresh()->created_at->toDateTimeString();

        $this->gocuCalistir();

        $this->assertSame($once, $taze->fresh()->created_at->toDateTimeString());
    }

    public function test_goc_ikinci_kez_calisinca_zarar_vermiyor(): void
    {
        $yazar = User::factory()->doctor()->create();
        MedStreamPost::factory()->create(['author_id' => $yazar->id, 'created_at' => now()->subDays(109)]);

        $this->gocuCalistir();
        $ilk = MedStreamPost::max('created_at');

        $this->gocuCalistir();

        // İlk çalıştırma tarihleri 60 günün içine çektiği için ikincisi
        // hiçbir şey bulmamalı.
        $this->assertSame($ilk, MedStreamPost::max('created_at'));
    }
}
