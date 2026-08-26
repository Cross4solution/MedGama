<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\DoctorProfile;
use App\Models\DoctorReview;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hastanın baştan sona yolculuğu — tek testte, kesintisiz.
 *
 * Bu paketin geri kalanı parçaları AYRI AYRI sınıyor: kayıt, arama, randevu,
 * muayene, fatura, değerlendirme. Hepsi tek tek geçerken zincirin kendisi
 * hiç koşulmamıştı — ve hatalar tam da devir teslim noktalarında saklanır:
 * bir adımın ürettiği kimlik, bir sonrakinin beklediği biçimde mi geliyor,
 * bir adımın kurduğu durum sonrakinin kapısını açıyor mu.
 *
 * Zincir kasten TEK test: adımlar birbirinin çıktısını kullanıyor, ayrı
 * testlere bölünürse her biri kendi kurulumunu yapar ve bağlantı noktaları
 * yine sınanmamış kalır.
 *
 * Her adım bir sonraki için ÖN KOŞUL doğruluyor; böylece kırılma olduğunda
 * hangi devir teslimin bozulduğu doğrudan görünüyor.
 */
class UctanUcaYolculukTest extends TestCase
{
    use RefreshDatabase;

    private function olarak(string $jeton): self
    {
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_hasta_kayittan_degerlendirmeye_kadar_ilerleyebiliyor(): void
    {
        // ── 1. Hekim ve müsait saat hazır ──
        $hekim = User::factory()->doctor()->create(['is_verified' => true, 'fullname' => 'Dr. Zincir Testi']);
        $hekim->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();
        DoctorProfile::create([
            'user_id'   => $hekim->id,
            'specialty' => 'Kardiyoloji',
            'slug'      => 'dr-zincir-' . substr($hekim->id, 0, 6),
        ]);

        $slot = CalendarSlot::create([
            'doctor_id'        => $hekim->id,
            'slot_date'        => now()->addDays(5)->toDateString(),
            'start_time'       => '11:00',
            'duration_minutes' => 30,
            'is_available'     => true,
        ]);

        // ── 2. Hasta kaydoluyor ──
        $kayit = $this->postJson('/api/auth/register', [
            'fullname'              => 'Zincir Hastasi',
            'email'                 => 'zincir.hastasi@ornek.test',
            'username'              => 'zincirhasta',
            // uncompromised() kuralı sızıntı listesindeki parolaları reddediyor
            'password'              => 'Qz8#vRt2mKp5wLx9',
            'password_confirmation' => 'Qz8#vRt2mKp5wLx9',
            'role_id'               => 'patient',
            'date_of_birth'         => '1990-05-12',
            'health_data_consent'   => true,
        ]);

        $this->assertContains($kayit->getStatusCode(), [200, 201], 'kayıt adımı kırıldı: ' . $kayit->getContent());

        $hasta = User::where('email', 'zincir.hastasi@ornek.test')->firstOrFail();

        // E-posta doğrulaması ayrı bir akış ve canlıda posta gönderimi yok;
        // zincirin devamı için doğrulanmış sayılıyor. Doğrulamanın kendisi
        // EpostaDogrulamaTest'te sınanıyor.
        $hasta->forceFill(['email_verified' => true, 'email_verified_at' => now()])->save();

        $jeton = $hasta->createToken('zincir')->plainTextToken;

        // ── 3. Hasta hekimi arayıp buluyor ──
        $arama = $this->getJson('/api/search/live?q=Zincir')->assertOk()->json();
        $bulunanlar = array_column($arama['doctors'] ?? [], 'id');

        $this->assertContains($hekim->id, $bulunanlar, 'arama adımı kırıldı: hekim bulunamadı');

        // ── 4. Müsait saatler görünüyor ──
        $musaitlik = $this->getJson("/api/doctors/{$hekim->id}/availability")->assertOk()->json('availability');
        $tumSlotlar = collect($musaitlik)->flatten(1)->pluck('id')->all();

        $this->assertContains($slot->id, $tumSlotlar, 'müsaitlik adımı kırıldı: açık slot listede yok');

        // ── 5. Randevu alınıyor ──
        $randevuYaniti = $this->olarak($jeton)->postJson('/api/appointments', [
            'patient_id'       => $hasta->id,
            'doctor_id'        => $hekim->id,
            'appointment_type' => 'inPerson',
            'slot_id'          => $slot->id,
            'appointment_date' => $slot->slot_date->format('Y-m-d'),
            'appointment_time' => '11:00',
        ]);

        $this->assertSame(201, $randevuYaniti->getStatusCode(), 'randevu adımı kırıldı: ' . $randevuYaniti->getContent());

        $randevu = Appointment::where('patient_id', $hasta->id)->firstOrFail();

        // Devir teslim: alınan slot artık başkasına açık olmamalı.
        $this->assertFalse((bool) $slot->fresh()->is_available, 'slot rezervasyonu randevuya bağlanmadı');

        // ── 6. Aynı saat ikinci kez alınamıyor ──
        $ikinciHasta = User::factory()->patient()->create();
        $ikinciJeton = $ikinciHasta->createToken('zincir2')->plainTextToken;

        $cakisma = $this->olarak($ikinciJeton)->postJson('/api/appointments', [
            'patient_id'       => $ikinciHasta->id,
            'doctor_id'        => $hekim->id,
            'appointment_type' => 'inPerson',
            'slot_id'          => $slot->id,
            'appointment_date' => $slot->slot_date->format('Y-m-d'),
            'appointment_time' => '11:00',
        ]);

        $this->assertNotSame(201, $cakisma->getStatusCode(), 'aynı slot ikinci kez verildi');

        // ── 7. Muayene tamamlanıyor ──
        $randevu->forceFill(['status' => 'completed'])->save();

        // ── 8. Hekim hastanın anamnezine erişebiliyor ──
        $hekimJeton = $hekim->createToken('zincir-hekim')->plainTextToken;

        $this->olarak($hekimJeton)
            ->getJson("/api/appointments/{$randevu->id}/medical-context")
            ->assertOk();

        // ── 9. Fatura kesiliyor ──
        $faturaYaniti = $this->olarak($hekimJeton)->postJson('/api/crm/billing/invoices', [
            'patient_id' => $hasta->id,
            'items'      => [['description' => 'Kardiyoloji muayenesi', 'quantity' => 1, 'unit_price' => 750]],
        ]);

        $this->assertSame(201, $faturaYaniti->getStatusCode(), 'fatura adımı kırıldı: ' . $faturaYaniti->getContent());

        $fatura = Invoice::where('patient_id', $hasta->id)->firstOrFail();
        $this->assertSame(750.0, (float) $fatura->grand_total, 'fatura tutarı yanlış hesaplandı');

        // ── 10. Hasta kendi faturasını görebiliyor ──
        $this->assertStringContainsString(
            $fatura->invoice_number,
            // Hastanın kendi faturaları AYRI önekte: /patient/billing.
            // CRM öneki role:doctor,clinicOwner,hospital ile korunuyor.
            $this->olarak($jeton)->getJson('/api/patient/billing/invoices')->assertOk()->getContent(),
            'hasta kendi faturasını göremedi',
        );

        // ── 11. Hasta değerlendirme yazabiliyor ──
        $degerlendirme = $this->olarak($jeton)->postJson("/api/doctors/{$hekim->id}/reviews", [
            'rating'         => 5,
            'comment'        => 'Cok ilgili ve aciklayiciydi, tesekkur ederim.',
            'appointment_id' => $randevu->id,
        ]);

        $this->assertSame(201, $degerlendirme->getStatusCode(), 'değerlendirme adımı kırıldı: ' . $degerlendirme->getContent());

        // ── 12. Değerlendirme moderasyondan geçmeden herkese görünmüyor ──
        $yorum = DoctorReview::where('patient_id', $hasta->id)->firstOrFail();
        $this->assertSame('pending', $yorum->moderation_status, 'değerlendirme doğrudan yayımlandı');

        $this->assertStringNotContainsString(
            'Cok ilgili ve aciklayiciydi',
            $this->getJson("/api/doctors/{$hekim->id}/reviews")->assertOk()->getContent(),
            'onaysız değerlendirme herkese açık listede göründü',
        );
    }

    public function test_klinik_sahibi_kendi_kliniginin_isini_bastan_sona_yurutebiliyor(): void
    {
        // İkinci zincir: sağlayıcı tarafı. Hasta zinciriyle aynı uçlar farklı
        // rolle geçiliyor; kapsam kuralları burada kırılırsa görünür.
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = \App\Models\Clinic::factory()->create([
            'owner_id'      => $sahip->id,
            'is_crm_active' => true,
            'is_active'     => true,
        ]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $hekim = User::factory()->doctor()->create([
            'clinic_id'   => $klinik->id,
            'is_verified' => true,
        ]);
        $hasta = User::factory()->patient()->create();

        $randevu = Appointment::factory()->confirmed()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $hekim->id,
            'clinic_id'  => $klinik->id,
        ]);

        $sahipJeton = $sahip->createToken('zincir-klinik')->plainTextToken;

        // Klinik kendi randevusunu görüyor
        $this->assertStringContainsString(
            $randevu->id,
            $this->olarak($sahipJeton)->getJson('/api/appointments')->assertOk()->getContent(),
            'klinik kendi randevusunu göremedi',
        );

        // Klinik kendi hastasını CRM'de görüyor
        $this->olarak($sahipJeton)->getJson('/api/crm/patients')->assertOk();

        // Klinik kendi hekiminin takvimini yönetebiliyor
        $slot = CalendarSlot::create([
            'doctor_id'        => $hekim->id,
            'slot_date'        => now()->addDays(4)->toDateString(),
            'start_time'       => '14:00',
            'duration_minutes' => 30,
            'is_available'     => true,
        ]);

        $this->olarak($sahipJeton)
            ->putJson("/api/calendar-slots/{$slot->id}", ['is_available' => false])
            ->assertOk();

        // Klinik kendi faturasını kesebiliyor
        $this->olarak($sahipJeton)->postJson('/api/crm/billing/invoices', [
            'patient_id' => $hasta->id,
            'items'      => [['description' => 'Kontrol', 'quantity' => 1, 'unit_price' => 300]],
        ])->assertStatus(201);
    }
}
