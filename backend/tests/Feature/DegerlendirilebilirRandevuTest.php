<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Deneyiminizi Puanlayın" listesi — hasta panelindeki değerlendirme daveti.
 *
 * Bu bölüm panelde görünmüyordu. Uç önce 500 veriyordu (var olmayan bir
 * ilişki yükleniyordu, ayrı düzeltildi); sonrasında 200 dönmeye başladı ama
 * canlıda LİSTE BOŞ geliyordu — oysa hastanın beş tamamlanmış randevusu
 * vardı ve ilgili doktora hiç yorum yazmamıştı.
 *
 * Testler beklenen davranışı sabitliyor:
 *   • tamamlanmış ve değerlendirilmemiş randevu listede olmalı,
 *   • yorum yazılmış doktor listeden düşmeli,
 *   • tamamlanmamış randevu listeye girmemeli.
 */
class DegerlendirilebilirRandevuTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: User} hasta, doktor */
    private function ortam(): array
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id]);
        $hasta  = User::factory()->patient()->create();

        return [$hasta, $doktor, $klinik];
    }

    private function randevu(User $hasta, User $doktor, Clinic $klinik, string $durum): Appointment
    {
        return Appointment::factory()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
            'clinic_id'  => $klinik->id,
            'status'     => $durum,
            'starts_at'  => now()->subDays(3),
            'timezone'   => 'Europe/Istanbul',
        ]);
    }

    public function test_tamamlanmis_randevu_listede_cikiyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->ortam();
        $this->randevu($hasta, $doktor, $klinik, 'completed');

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/doctors/reviewable-appointments')
            ->assertOk();

        $this->assertCount(
            1,
            $yanit->json('data'),
            'Tamamlanmış ve değerlendirilmemiş randevu listede yok',
        );
    }

    public function test_ayni_doktorla_birden_cok_randevu_listeleniyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->ortam();
        for ($i = 0; $i < 5; $i++) {
            $this->randevu($hasta, $doktor, $klinik, 'completed');
        }

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/doctors/reviewable-appointments')
            ->assertOk();

        $this->assertNotEmpty(
            $yanit->json('data'),
            'Beş tamamlanmış randevu varken liste boş döndü',
        );
    }

    public function test_yorum_yazilan_doktor_listeden_dusuyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->ortam();
        $randevu = $this->randevu($hasta, $doktor, $klinik, 'completed');

        DoctorReview::create([
            'doctor_id'      => $doktor->id,
            'patient_id'     => $hasta->id,
            'appointment_id' => $randevu->id,
            'rating'         => 5,
            'comment'        => 'Test',
        ]);

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/doctors/reviewable-appointments')
            ->assertOk();

        $this->assertSame([], $yanit->json('data'), 'Yorum yazılan doktor hâlâ listede');
    }

    public function test_vitrin_tohumlamasi_demo_hastasina_davet_uretiyor(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $hasta = User::factory()->patient()->create(['email' => 'patient@demo.com']);

        \Illuminate\Support\Facades\Artisan::call('db:seed', [
            '--class' => 'VitrinSeeder', '--force' => true,
        ]);

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/doctors/reviewable-appointments')
            ->assertOk();

        $this->assertNotEmpty($yanit->json('data'), 'Vitrin tohumlaması hiç davet üretmedi');

        // Birden çok doktora yayılmalı: tek doktora bağlı bir liste, o doktor
        // puanlandığı anda tamamen boşalıyor — canlıda tam olarak bu oldu.
        $doktorlar = array_unique(array_column($yanit->json('data'), 'doctor_id'));
        $this->assertGreaterThan(1, count($doktorlar), 'Davetlerin hepsi tek doktora bağlı');
    }

    public function test_vitrin_tohumlamasi_tekrar_calisinca_cogaltmiyor(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        User::factory()->patient()->create(['email' => 'patient@demo.com']);

        $calistir = fn () => \Illuminate\Support\Facades\Artisan::call('db:seed', [
            '--class' => 'VitrinSeeder', '--force' => true,
        ]);

        $calistir();
        $ilk = Appointment::count();
        $calistir();

        $this->assertSame($ilk, Appointment::count(), 'İkinci tohumlama randevu çoğalttı');
    }

    public function test_tamamlanmamis_randevu_listeye_girmiyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->ortam();
        $this->randevu($hasta, $doktor, $klinik, 'pending');
        $this->randevu($hasta, $doktor, $klinik, 'confirmed');

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/doctors/reviewable-appointments')
            ->assertOk();

        $this->assertSame([], $yanit->json('data'), 'Tamamlanmamış randevu listeye girmiş');
    }
}
