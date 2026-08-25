<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `/api/doctors` kimlik istemiyor — ne döndürdüğü buna göre seçilmeli.
 *
 * Uç, on dört doktorun on dördünün E-POSTA adresini döndürüyordu. Giriş yapmamış
 * biri tek istekle tam listeyi çekip toplayabiliyordu. Ekranda da
 * kullanılmıyordu: listeyi tüketen iki yer (`SearchResults`,
 * `TelehealthAppointmentPage`) alanı hiç okumuyor.
 *
 * E-postayı meşru olarak gösteren ekranlar var — klinik ekip yönetimi, yönetici
 * doğrulama, CRM klinik yöneticisi — ama onların hepsi kendi KİMLİK GEREKTİREN
 * uçlarını kullanıyor (`clinicAPI.onboardingProfile`,
 * `adminAPI.verificationRequests`, `clinicManagerAPI.doctors`). Yani alanı bu
 * listeden çıkarmak hiçbir ekranı etkilemiyor.
 *
 * Aynı kural `/search/live` için `AcikAramaTest` ile zaten korunuyordu; bu iki
 * uç o taramanın dışında kalmıştı — hem liste hem DETAY.
 *
 * Hata sınıfı sessiz: `select()` listesine bir sütun eklemek yanıtı büyütür,
 * hiçbir şey kırılmaz, kimse fark etmez.
 */
class AcikDoktorListesiTest extends TestCase
{
    use RefreshDatabase;

    private function doktor(string $ad, string $eposta): User
    {
        $kullanici = User::factory()->create([
            'role_id' => 'doctor',
            'fullname' => $ad,
            'email' => $eposta,
            'is_active' => true,
        ]);

        DoctorProfile::create([
            'user_id' => $kullanici->id,
            'specialty' => 'Kardiyoloji',
            'slug' => 'dr-'.substr($kullanici->id, 0, 8),
        ]);

        return $kullanici;
    }

    public function test_kimliksiz_liste_eposta_vermiyor(): void
    {
        $this->doktor('Dr. Gizli Adres', 'gizli.adres@ornek.test');

        $yanit = $this->getJson('/api/doctors?per_page=50');

        $yanit->assertOk();
        $yanit->assertDontSee('gizli.adres@ornek.test');

        $ilk = $yanit->json('data.0');
        $this->assertArrayNotHasKey('email', $ilk, 'herkese açık listede e-posta alanı var');
    }

    public function test_baska_kisisel_alanlar_da_gelmiyor(): void
    {
        // Bugün seçilmiyorlar; `select()` listesine eklenmeleri sessiz olurdu.
        $this->doktor('Dr. Biri', 'biri@ornek.test');

        $ilk = $this->getJson('/api/doctors?per_page=50')->json('data.0');

        foreach (['email', 'mobile', 'phone', 'date_of_birth', 'password', 'remember_token'] as $alan) {
            $this->assertArrayNotHasKey($alan, $ilk, "herkese açık listede `$alan` dönüyor");
        }
    }

    public function test_ekranin_ihtiyaci_alanlar_duruyor(): void
    {
        // Aşırı kısmak da hata olurdu: kart bu alanlarla çiziliyor.
        $this->doktor('Dr. Biri', 'biri@ornek.test');

        $ilk = $this->getJson('/api/doctors?per_page=50')->json('data.0');

        foreach (['id', 'fullname', 'avatar', 'is_verified'] as $alan) {
            $this->assertArrayHasKey($alan, $ilk, "kartın ihtiyacı olan `$alan` alanı kaybolmuş");
        }
    }

    public function test_detay_ucu_de_eposta_vermiyor(): void
    {
        // Aynı sızıntı iki yerdeydi: liste ve DETAY. İlk taramada detayı
        // "temiz" sanmıştım çünkü yanıtın sarmalayıcısını yanlış okumuştum —
        // e-posta `doctor` nesnesinin içindeydi. Ham metinde aramak bunu
        // ortaya çıkardı; ölçüt de ham metne bakıyor.
        $doktor = $this->doktor('Dr. Gizli Adres', 'gizli.adres@ornek.test');

        $yanit = $this->getJson('/api/doctors/'.$doktor->id);

        $yanit->assertOk();
        $yanit->assertDontSee('gizli.adres@ornek.test');
        $this->assertArrayNotHasKey('email', $yanit->json('doctor'), 'detayda e-posta alanı var');

        // Sayfanın çizim için ihtiyaç duyduğu yapı bozulmamalı.
        foreach (['doctor', 'review_stats', 'upcoming_slots'] as $anahtar) {
            $this->assertArrayHasKey($anahtar, $yanit->json(), "detay yanıtından `$anahtar` kaybolmuş");
        }
    }

    public function test_oneri_ucu_de_eposta_vermiyor(): void
    {
        // Aynı damardaki komşu uç.
        $this->doktor('Dr. Gizli Adres', 'gizli.adres@ornek.test');

        $yanit = $this->getJson('/api/doctors/suggestions?search_text=Gizli');

        $yanit->assertOk();
        $yanit->assertDontSee('gizli.adres@ornek.test');
    }
}
