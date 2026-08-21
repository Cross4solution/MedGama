<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Vasco — şikâyet metninden doğru uzmanlığa yönlendirme.
 *
 * Bu ucun hiç testi yoktu, oysa hastanın sisteme ilk temas noktası burası ve
 * herkese açık (oturum istemiyor). Sınanan şey doğru doktoru bulması değil —
 * o bir kalite ölçüsü — davranış güvenceleri:
 *
 *   • TEŞHİS KOYMAZ. Yanıt her zaman uyarı bayrağı taşır.
 *   • LLM ANAHTARI OLMADAN ÇALIŞIR. Canlıda anahtar tanımlı olmayabilir;
 *     o durumda kelime eşleştirmeye düşüyor. Bu yol kırılırsa özellik
 *     sessizce boş sonuç döndürmeye başlar.
 *   • LLM ÇÖKERSE UÇ ÇÖKMEZ. Dış sağlayıcı hata verdiğinde 500 değil,
 *     kelime eşleştirmesiyle yanıt gelmeli.
 *   • TÜRKÇE BÜYÜK/KÜÇÜK HARF. "İdrar" ile "idrar" aynı sonucu vermeli;
 *     PHP'nin mb_strtolower'ı İ/I çiftini yanlış çeviriyor, servis bunu
 *     elle düzeltiyor.
 *   • DOĞRULANMIŞ DOKTOR ÖNE ÇIKAR.
 */
class VascoYonlendirmeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Dış sağlayıcıya gerçek istek gitmesin.
        Http::preventStrayRequests();
        // Anahtarsız hâl varsayılan: kelime eşleştirme yolu sınanıyor.
        config(['vasco.llm.key' => null]);
    }

    private function uzmanlik(string $kod, string $ad): Specialty
    {
        return Specialty::create([
            'code'          => $kod,
            'name'          => ['tr' => $ad, 'en' => $ad],
            'description'   => ['tr' => $ad, 'en' => $ad],
            'display_order' => 1,
        ]);
    }

    private function doktor(Specialty $uzmanlik, bool $dogrulanmis, string $ad): User
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create([
            'fullname'    => $ad,
            'clinic_id'   => $klinik->id,
            'is_active'   => true,
            'is_verified' => $dogrulanmis,
        ]);

        DoctorProfile::create([
            'user_id'      => $doktor->id,
            'clinic_id'    => $klinik->id,
            'specialty'    => $uzmanlik->code,
            'specialty_id' => $uzmanlik->id,
        ]);

        return $doktor;
    }

    public function test_kalp_sikayeti_kardiyolojiye_yonlendiriliyor(): void
    {
        $kardiyoloji = $this->uzmanlik('CARD', 'Kardiyoloji');
        $this->doktor($kardiyoloji, true, 'Dr. Kalp Uzmanı');

        $yanit = $this->postJson('/api/vasco/suggest', [
            'text' => 'Göğsümde ağrı ve çarpıntı var',
            'lang' => 'tr',
        ])->assertOk();

        $this->assertSame('CARD', $yanit->json('specialty.code'), 'Kalp şikâyeti kardiyolojiye gitmedi');
        $this->assertNotEmpty($yanit->json('doctors'), 'Uzmanlık bulundu ama doktor önerilmedi');
    }

    public function test_teshis_koymadigi_yanitta_isaretli(): void
    {
        $this->uzmanlik('CARD', 'Kardiyoloji');

        $this->postJson('/api/vasco/suggest', ['text' => 'Göğüs ağrısı', 'lang' => 'tr'])
            ->assertOk()
            ->assertJsonPath('disclaimer', true);
    }

    public function test_bos_metin_dogrulamada_kesiliyor(): void
    {
        // Laravel gelen metni kırpıyor, dolayısıyla yalnızca boşluktan oluşan
        // şikâyet "required" kuralına takılıyor ve servise hiç ulaşmıyor.
        // Servisteki boş-metin dalı bu yüzden HTTP üzerinden erişilemez;
        // doğru davranış bu, ama nedenini yazmadan bakınca ölü kod sanılıyor.
        $this->postJson('/api/vasco/suggest', ['text' => '   ', 'lang' => 'tr'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('text');
    }

    public function test_servis_bos_metinde_bos_sonuc_donduruyor(): void
    {
        // Servis doğrudan çağrıldığında (ileride başka bir uçtan) boş metin
        // çökmeye değil boş sonuca gitmeli.
        $sonuc = app(\App\Services\VascoService::class)->suggest('   ');

        $this->assertNull($sonuc['specialty']);
        $this->assertSame([], $sonuc['doctors']);
    }

    public function test_turkce_buyuk_harf_ayni_sonucu_veriyor(): void
    {
        $uroloji = $this->uzmanlik('UROL', 'Üroloji');
        $this->doktor($uroloji, true, 'Dr. Üroloji');

        $kucuk = $this->postJson('/api/vasco/suggest', ['text' => 'idrar yaparken yanma', 'lang' => 'tr']);
        $buyuk = $this->postJson('/api/vasco/suggest', ['text' => 'İDRAR YAPARKEN YANMA', 'lang' => 'tr']);

        $this->assertSame(
            $kucuk->json('specialty.code'),
            $buyuk->json('specialty.code'),
            'Büyük harfle yazılan şikâyet farklı uzmanlığa gitti',
        );
        $this->assertSame('UROL', $kucuk->json('specialty.code'));
    }

    public function test_llm_cokerse_uc_cokmüyor_kelime_eslestirmesine_dusuyor(): void
    {
        // Anahtar tanımlı ama sağlayıcı hata veriyor.
        config(['vasco.llm.key' => 'deneme-anahtar', 'vasco.llm.base' => 'https://ornek.test/v1']);
        Http::fake(['ornek.test/*' => Http::response('sunucu hatası', 500)]);

        $kardiyoloji = $this->uzmanlik('CARD', 'Kardiyoloji');
        $this->doktor($kardiyoloji, true, 'Dr. Kalp');

        $yanit = $this->postJson('/api/vasco/suggest', [
            'text' => 'kalbimde çarpıntı var',
            'lang' => 'tr',
        ])->assertOk();

        $this->assertSame('CARD', $yanit->json('specialty.code'), 'LLM çökünce kelime eşleştirmesi devreye girmedi');
    }

    public function test_dogrulanmis_doktor_once_geliyor(): void
    {
        $goz = $this->uzmanlik('OPHT', 'Göz Hastalıkları');
        $this->doktor($goz, false, 'Dr. Doğrulanmamış');
        $this->doktor($goz, true, 'Dr. Doğrulanmış');

        $doktorlar = $this->postJson('/api/vasco/suggest', ['text' => 'gözümde bulanık görme', 'lang' => 'tr'])
            ->assertOk()
            ->json('doctors');

        $this->assertNotEmpty($doktorlar);
        $this->assertTrue(
            (bool) $doktorlar[0]['is_verified'],
            'Doğrulanmamış doktor doğrulanmışın önüne geçmiş',
        );
    }

    public function test_oturum_gerektirmiyor(): void
    {
        $this->uzmanlik('DENT', 'Diş Hekimliği');

        // Ziyaretçinin ilk temas noktası; giriş istemesi akışı kırar.
        $this->postJson('/api/vasco/suggest', ['text' => 'diş ağrım var', 'lang' => 'tr'])
            ->assertOk();
    }

    public function test_cok_uzun_metin_reddediliyor(): void
    {
        $this->postJson('/api/vasco/suggest', ['text' => str_repeat('a', 2001), 'lang' => 'tr'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('text');
    }
}
