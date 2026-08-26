<?php

namespace Tests\Feature;

use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Kapsam dışında kalan son uçlar.
 *
 * Üç grup:
 *
 *   • Sertifika görseli yükleme. Hekim profilinde HERKESE gösterilen bir
 *     görsel — doğrulama belgesiyle karıştırılmamalı, o özel diskte durur
 *     (bkz. YuklemeDiskAyrimiTest). Burada sınanan: tür kısıtı, boyut kısıtı
 *     ve rolün doğru olması.
 *
 *   • Katalog arama uçları. Arama kutusunun otomatik tamamlaması bunlarla
 *     çalışıyor; boş sorguda bütün kataloğu dökmemeleri gerekiyor.
 *
 *   • `geo/suggest-radius` ve `geo/ip-country`. İlki koordinatı İKİ basamağa
 *     yuvarlıyor (~1 km) — ters-geocode'dan bile kaba, çünkü yalnız yoğunluk
 *     ölçüyor.
 */
class SonUclarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_sertifika_gorseli_yuklenebiliyor(): void
    {
        Storage::fake('public');

        $hekim = User::factory()->doctor()->create(['is_verified' => true]);

        $this->olarak($hekim)
            ->postJson('/api/doctor-profile/certification-image', [
                'image' => UploadedFile::fake()->image('diploma.jpg', 400, 300),
            ])
            ->assertOk()
            ->assertJsonStructure(['url']);
    }

    public function test_sertifika_gorseli_belge_turu_kabul_etmiyor(): void
    {
        // Bu alan bir GÖRSEL için: profilde gösteriliyor. PDF ya da betik
        // yüklenebilseydi herkese açık diske belge düşerdi.
        $hekim = User::factory()->doctor()->create(['is_verified' => true]);

        foreach ([
            UploadedFile::fake()->create('belge.pdf', 20, 'application/pdf'),
            UploadedFile::fake()->create('betik.svg', 5, 'image/svg+xml'),
        ] as $dosya) {
            $this->olarak($hekim)
                ->postJson('/api/doctor-profile/certification-image', ['image' => $dosya])
                ->assertStatus(422);
        }
    }

    public function test_hasta_sertifika_gorseli_yukleyemiyor(): void
    {
        $this->olarak(User::factory()->patient()->create())
            ->postJson('/api/doctor-profile/certification-image', [
                'image' => UploadedFile::fake()->image('x.jpg'),
            ])
            ->assertStatus(403);
    }

    public function test_katalog_aramasi_bos_sorguda_her_seyi_dokmuyor(): void
    {
        foreach (range(1, 5) as $i) {
            Specialty::create(['code' => "arama-$i", 'name' => "Arama Uzmanlığı $i"]);
        }

        foreach (['/api/catalog/search?q=', '/api/catalog/specialties/search?q='] as $uc) {
            $yanit = $this->getJson($uc)->assertOk()->json();

            $kayitlar = $yanit['data'] ?? $yanit['results'] ?? $yanit;
            $sayi = is_array($kayitlar) ? count($kayitlar, COUNT_RECURSIVE) : 0;

            $this->assertLessThan(
                50,
                $sayi,
                "$uc boş sorguda kataloğu döküyor: arama kutusu her açılışta tüm listeyi çeker",
            );
        }
    }

    public function test_yaricap_onerisi_koordinati_kabaca_yuvarliyor(): void
    {
        // İki basamak (~1 km): yoğunluk ölçmek için yeterli, kişinin yerini
        // göstermek için değil.
        $yanit = $this->getJson('/api/geo/suggest-radius?lat=41.0082376&lon=28.9783589')
            ->assertOk()
            ->json();

        $this->assertArrayHasKey('radius', $yanit);
        $this->assertIsNumeric($yanit['radius']);
    }

    public function test_ip_ulkesi_kimliksiz_calisiyor(): void
    {
        // Ana sayfa açılışında ülke tahmini için; oturum istemesi anlamsız olurdu.
        $this->getJson('/api/geo/ip-country')
            ->assertOk()
            ->assertJsonStructure(['country']);
    }
}
