<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Süzgeçsiz doktor listesinin önbelleklenmesi.
 *
 * Canlı ölçümde bu uç isteğin ~200 ms'sini yalnızca veritabanını beklemekle
 * geçiriyordu ve açılış sayfası her ziyaretçide aynı beş sorguyu tekrar
 * çalıştırıyordu.
 *
 * Önbellek doğruysa iki şey aynı anda doğru olmalı: yanıt değişmemeli ve
 * süzgeçli aramalar önbelleğe hiç girmemeli.
 */
class DoktorListesiOnbellekTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $klinik = Clinic::factory()->create();
        User::factory()->doctor()->count(4)->create(['clinic_id' => $klinik->id]);
    }

    private function sorguSayisi(callable $istek): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $istek();
        $sayi = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $sayi;
    }

    public function test_ikinci_istek_veritabanina_gitmiyor(): void
    {
        $ilk = $this->sorguSayisi(fn () => $this->getJson('/api/doctors?per_page=20'));
        $this->assertGreaterThan(0, $ilk, 'İlk istek zaten veritabanına gitmiyor — ölçüm anlamsız.');

        $ikinci = $this->sorguSayisi(fn () => $this->getJson('/api/doctors?per_page=20'));
        $this->assertSame(0, $ikinci, "İkinci istek hâlâ {$ikinci} sorgu atıyor — önbellek çalışmıyor.");
    }

    public function test_onbellekli_yanit_onbelleksizle_ayni(): void
    {
        $taze = $this->getJson('/api/doctors?per_page=20')->json();
        $onbellekli = $this->getJson('/api/doctors?per_page=20')->json();

        // Önbellek yanıtın biçimini değiştirirse istemci sessizce bozulur.
        $this->assertSame($taze, $onbellekli, 'Önbellekli yanıt farklı geldi.');
        $this->assertArrayHasKey('data', $taze);
        $this->assertCount(4, $taze['data']);
    }

    public function test_suzgecli_arama_onbellege_girmiyor(): void
    {
        $this->getJson('/api/doctors?per_page=20');           // önbelleği doldur
        $this->getJson('/api/doctors?search_text=zzzz');       // eşleşmeyen arama

        $sorgu = $this->sorguSayisi(fn () => $this->getJson('/api/doctors?search_text=zzzz'));
        $this->assertGreaterThan(0, $sorgu, 'Süzgeçli arama önbellekten dönüyor — sonuçlar bayatlar.');
    }

    public function test_farkli_sayfa_ve_siralama_ayri_tutuluyor(): void
    {
        $sayfa1 = $this->getJson('/api/doctors?per_page=2&page=1')->json();
        $sayfa2 = $this->getJson('/api/doctors?per_page=2&page=2')->json();

        // Anahtar sayfayı içermezse ikinci sayfa birincinin kopyası olurdu.
        $this->assertNotSame(
            array_column($sayfa1['data'], 'id'),
            array_column($sayfa2['data'], 'id'),
            'İkinci sayfa birinci sayfayla aynı kayıtları döndürdü.',
        );
    }

    public function test_yeni_doktor_sure_dolunca_gorunuyor(): void
    {
        $this->getJson('/api/doctors?per_page=20');

        $klinik = Clinic::factory()->create();
        User::factory()->doctor()->create(['clinic_id' => $klinik->id]);

        // Süre dolmadan eski liste dönmeli (bilinçli ödün).
        $this->assertCount(4, $this->getJson('/api/doctors?per_page=20')->json()['data']);

        // Süre dolduğunda yeni doktor görünmeli — önbellek kalıcı olmamalı.
        $this->travel(61)->seconds();
        $this->assertCount(5, $this->getJson('/api/doctors?per_page=20')->json()['data']);
    }
}
