<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Takvim aboneliği (.ics) — oturumsuz, tek koruma gizli belirteç.
 *
 * Bu uç herkese açık: Google/Apple Takvim'in oturum açmadan çekebilmesi
 * gerekiyor, o yüzden adresin içindeki belirteç tek kapı. Akışın içeriği
 * randevu saatleri, doktor ve hasta adları — yani belirteç sızarsa kişinin
 * bütün randevu geçmişi okunur.
 *
 * Testi yoktu. Sınananlar:
 *   • Belirteç yalnızca SAHİBİNİN randevularını açıyor.
 *   • Geçersiz belirteç hiçbir şey vermiyor.
 *   • Belirteç tahmin edilemeyecek uzunlukta ve kullanıcıya özel.
 */
class TakvimAkisiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Saat parametresi şart: aynı doktora aynı saate ikinci randevu
     * yazmak veritabanındaki çakışma anahtarına takılıyor — çift rezervasyonu
     * engelleyen koruma. Testin verisi o korumayı ihlal etmemeli.
     */
    private function randevu(User $hasta, User $doktor, Clinic $klinik, string $not, string $saat = '10:00'): Appointment
    {
        return Appointment::factory()->create([
            'patient_id'       => $hasta->id,
            'doctor_id'        => $doktor->id,
            'clinic_id'        => $klinik->id,
            'status'           => 'confirmed',
            'starts_at'        => now()->addDay(),
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => $saat,
            'timezone'         => 'Europe/Istanbul',
            'doctor_note'      => $not,
        ]);
    }

    public function test_belirtec_yalnizca_sahibinin_randevusunu_veriyor(): void
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id, 'is_verified' => true]);

        $benim  = User::factory()->patient()->create(['fullname' => 'BENIM-HASTA']);
        $baskasi = User::factory()->patient()->create(['fullname' => 'BASKA-HASTA']);

        $benimRandevum = $this->randevu($benim, $doktor, $klinik, 'benim randevum');
        $digerRandevu  = $this->randevu($baskasi, $doktor, $klinik, 'baskasinin randevusu', '11:00');

        $ics = $this->get('/api/calendar/feed/' . $benim->getOrCreateCalendarToken())
            ->assertOk()
            ->getContent();

        // Ölçüt randevu KİMLİĞİ (UID satırı). İlk yazışta hasta adı aranıyordu
        // ama hastanın kendi akışında karşı tarafın adı yazıyor (doktorunki),
        // başka hastaların adı hiç geçmiyor. Dolayısıyla o kontrol sahiplik
        // filtresi tamamen kaldırıldığında bile yeşil kalıyordu — hiçbir şey
        // garanti etmiyordu.
        $this->assertStringContainsString('BEGIN:VCALENDAR', $ics);
        $this->assertStringContainsString(
            $benimRandevum->id,
            $ics,
            'Kişinin kendi randevusu takviminde yok',
        );
        $this->assertStringNotContainsString(
            $digerRandevu->id,
            $ics,
            'Takvim akışı başka bir hastanın randevusunu taşıyor',
        );
    }

    public function test_gecersiz_belirtec_veri_vermiyor(): void
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id, 'is_verified' => true]);
        $hasta  = User::factory()->patient()->create(['fullname' => 'GIZLI-HASTA']);
        $this->randevu($hasta, $doktor, $klinik, 'gizli');

        $yanit = $this->get('/api/calendar/feed/uydurma-belirtec-123');

        $yanit->assertNotFound();
        $this->assertStringNotContainsString('GIZLI-HASTA', $yanit->getContent());
    }

    public function test_belirtec_kullaniciya_ozel_ve_uzun(): void
    {
        $a = User::factory()->patient()->create();
        $b = User::factory()->patient()->create();

        $belirtecA = $a->getOrCreateCalendarToken();
        $belirtecB = $b->getOrCreateCalendarToken();

        $this->assertNotSame($belirtecA, $belirtecB, 'İki kullanıcı aynı belirteci paylaşıyor');
        // Kısa bir belirteç deneme yanılmayla bulunabilir; tek koruma bu.
        $this->assertGreaterThanOrEqual(32, strlen($belirtecA));
    }

    public function test_belirtec_tekrar_cagrilinca_degismiyor(): void
    {
        $kullanici = User::factory()->patient()->create();

        $ilk = $kullanici->getOrCreateCalendarToken();
        $ikinci = $kullanici->fresh()->getOrCreateCalendarToken();

        // Her çağrıda yeni belirteç üretilse, kullanıcının takvim aboneliği
        // sessizce kırılırdı.
        $this->assertSame($ilk, $ikinci);
    }

    public function test_doktor_kendi_randevularini_goruyor(): void
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create([
            'clinic_id' => $klinik->id, 'is_verified' => true, 'fullname' => 'Dr. Takvim',
        ]);
        $hasta = User::factory()->patient()->create(['fullname' => 'HASTA-ADI']);
        $this->randevu($hasta, $doktor, $klinik, 'muayene');

        $ics = $this->get('/api/calendar/feed/' . $doktor->getOrCreateCalendarToken())
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('BEGIN:VEVENT', $ics, 'Doktorun takviminde randevu görünmüyor');
    }
}
