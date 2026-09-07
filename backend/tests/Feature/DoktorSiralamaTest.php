<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Doktor listesi sıralaması — puan, deneyim, fiyat.
 *
 * Ölçüldüğünde `sort=rating` ve `sort=experience` seçenekleri vardı ama
 * üçü de aynı şeyi yapıyordu: doğrulanmış önce, sonra ada göre. Yani
 * arayüzde "puana göre" seçen kullanıcı ada göre sıralı liste alıyordu
 * ve bunu fark etmenin yolu yoktu. Fiyata göre sıralama hiç yoktu;
 * sözleşme bunu açıkça istiyor.
 *
 * Fiyat `prices` JSON'undan değil, kayıt anında hesaplanan `min_price`
 * sütunundan sıralanıyor; bu yüzden hem sütunun varlığı hem de hesabın
 * JSON'la birlikte güncel kaldığı ayrıca sınanıyor.
 */
class DoktorSiralamaTest extends TestCase
{
    use RefreshDatabase;

    private function doktor(string $ad, array $profil): User
    {
        $kullanici = User::factory()->create([
            'role_id'     => 'doctor',
            'fullname'    => $ad,
            'is_active'   => true,
            'is_verified' => true,
        ]);
        DoctorProfile::create(array_merge([
            'user_id'   => $kullanici->id,
            'specialty' => 'Kardiyoloji',
            'slug'      => 'dr-' . substr($kullanici->id, 0, 8),
        ], $profil));
        return $kullanici;
    }

    private function siraliAdlar(string $sort): array
    {
        $yanit = $this->getJson('/api/doctors?sort=' . $sort . '&per_page=10')->assertOk();
        return array_column($yanit->json('data'), 'fullname');
    }

    protected function setUp(): void
    {
        parent::setUp();
        // Ad sırası bilerek TERS: ada göre sıralama sızarsa fark edilsin.
        $this->doktor('Zeynep Yüksek Puan', ['avg_rating' => 4.9, 'review_count' => 10, 'experience_years' => 5,
            'prices' => [['label' => 'Muayene', 'min' => 800, 'max' => 1200, 'currency' => 'TRY']]]);
        $this->doktor('Mehmet Deneyimli', ['avg_rating' => 3.0, 'review_count' => 2, 'experience_years' => 20,
            'prices' => [['label' => 'Muayene', 'min' => 300, 'currency' => 'TRY'], ['label' => 'Kontrol', 'min' => 150]]]);
        $this->doktor('Ayşe Fiyatsız', ['avg_rating' => null, 'experience_years' => null, 'prices' => null]);
    }

    public function test_fiyat_sutunu_var_ve_json_ile_birlikte_guncelleniyor(): void
    {
        $this->assertTrue(Schema::hasColumn('doctor_profiles', 'min_price'),
            'doctor_profiles.min_price yok — fiyat sıralaması dayanacak sütunu kaybetti');

        $profil = DoctorProfile::whereHas('user', fn ($q) => $q->where('fullname', 'Mehmet Deneyimli'))->first();
        $this->assertSame(150.0, $profil->min_price, 'en düşük kalem (150) alınmalı, ilk kalem (300) değil');

        $profil->update(['prices' => [['label' => 'Muayene', 'max' => 900]]]);
        $this->assertSame(900.0, $profil->fresh()->min_price, 'min yoksa max kullanılmalı');

        $profil->update(['prices' => []]);
        $this->assertNull($profil->fresh()->min_price, 'fiyat kalmayınca sütun da boşalmalı');
    }

    public function test_puana_gore(): void
    {
        $this->assertSame(['Zeynep Yüksek Puan', 'Mehmet Deneyimli', 'Ayşe Fiyatsız'], $this->siraliAdlar('rating'));
    }

    public function test_deneyime_gore(): void
    {
        $this->assertSame(['Mehmet Deneyimli', 'Zeynep Yüksek Puan', 'Ayşe Fiyatsız'], $this->siraliAdlar('experience'));
    }

    public function test_fiyata_gore_artan_fiyatsizlar_sonda(): void
    {
        $this->assertSame(['Mehmet Deneyimli', 'Zeynep Yüksek Puan', 'Ayşe Fiyatsız'], $this->siraliAdlar('price_asc'));
    }

    public function test_fiyata_gore_azalan_fiyatsizlar_yine_sonda(): void
    {
        // Azalan sıralamada NULL'un başa gelmesi klasik hata; fiyatı olmayan
        // doktor "en pahalı" gibi listelenirdi.
        $this->assertSame(['Zeynep Yüksek Puan', 'Mehmet Deneyimli', 'Ayşe Fiyatsız'], $this->siraliAdlar('price_desc'));
    }

    public function test_varsayilan_ada_gore(): void
    {
        $this->assertSame(['Ayşe Fiyatsız', 'Mehmet Deneyimli', 'Zeynep Yüksek Puan'], $this->siraliAdlar('name'));
    }

    public function test_bilinmeyen_siralama_varsayilana_duser(): void
    {
        $this->assertSame($this->siraliAdlar('name'), $this->siraliAdlar('olmayan'));
    }
}
