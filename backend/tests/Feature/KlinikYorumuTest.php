<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\ClinicReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Klinik yorumu yazma — `POST /api/clinics/{id}/reviews`.
 *
 * Yazma uçları sayıldığında bu uç hiçbir testte geçmiyordu. Doktor yorumları
 * kapsanmıştı, klinik yorumları kapsanmamıştı.
 *
 * Bir sağlık platformunda yorum yazma yüzeyi, doğrudan suistimal yüzeyidir:
 * bir kliniğin puanını yükseltmek ya da rakibininkini düşürmek somut bir
 * kazanç. Denetleyici altı kapı tutuyor ve ALTISI DA sessizce kaldırılabilir —
 * kaldırıldığında uç 201 dönmeye devam eder, yalnız artık kimin yorum
 * yazabileceği değişmiştir:
 *
 *   1. Yorum bir randevuya bağlı olmalı (`appointment_id` zorunlu).
 *   2. Randevu yorumu yazanın olmalı.
 *   3. Randevu o kliniğe (ya da o kliniğin hekimine) ait olmalı.
 *   4. Randevu TAMAMLANMIŞ olmalı.
 *   5. Aynı kliniğe ikinci yorum yazılamaz.
 *   6. Yalnız hastalar yorum yazabilir.
 *
 * Bu ölçüt kusur bulmadı; altı kapının da yerinde durduğunu kaydediyor.
 */
class KlinikYorumuTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $klinik;
    private User $hekim;
    private User $hasta;

    protected function setUp(): void
    {
        parent::setUp();

        $sahip = User::factory()->clinicOwner()->create();
        $this->klinik = Clinic::factory()->create([
            'owner_id'  => $sahip->id,
            'is_active' => true,
        ]);
        $sahip->forceFill(['clinic_id' => $this->klinik->id])->save();

        $this->hekim = User::factory()->doctor()->create([
            'clinic_id'   => $this->klinik->id,
            'is_verified' => true,
        ]);

        $this->hasta = User::factory()->patient()->create();
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function randevu(array $govde = []): Appointment
    {
        return Appointment::factory()->create(array_merge([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $this->hekim->id,
            'clinic_id'  => $this->klinik->id,
            'status'     => 'completed',
        ], $govde));
    }

    private function yorumGovdesi(Appointment $randevu, array $ek = []): array
    {
        return array_merge([
            'rating'         => 5,
            'comment'        => 'Tedavi süreci baştan sona düzgün ilerledi, memnun kaldım.',
            'appointment_id' => $randevu->id,
        ], $ek);
    }

    public function test_tamamlanmis_randevusu_olan_hasta_yorum_yazabiliyor(): void
    {
        $randevu = $this->randevu();

        $this->olarak($this->hasta)
            ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($randevu))
            ->assertStatus(201);

        $this->assertDatabaseHas('clinic_reviews', [
            'clinic_id'  => $this->klinik->id,
            'patient_id' => $this->hasta->id,
            'rating'     => 5,
        ]);
    }

    public function test_randevusuz_yorum_yazilamiyor(): void
    {
        // En temel kapı: hiç gelmemiş biri yorum yazamamalı.
        $this->olarak($this->hasta)
            ->postJson("/api/clinics/{$this->klinik->id}/reviews", [
                'rating'  => 5,
                'comment' => 'Hiç gitmedim ama harika bir yer olduğunu duydum.',
            ])
            ->assertStatus(422);

        $this->assertDatabaseCount('clinic_reviews', 0);
    }

    public function test_baskasinin_randevusuyla_yorum_yazilamiyor(): void
    {
        $baskaHasta = User::factory()->patient()->create();
        $randevu = $this->randevu(['patient_id' => $baskaHasta->id]);

        $this->olarak($this->hasta)
            ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($randevu))
            ->assertStatus(403);

        $this->assertDatabaseCount('clinic_reviews', 0);
    }

    public function test_baska_klinigin_randevusuyla_yorum_yazilamiyor(): void
    {
        // Yoksa tek bir tamamlanmış randevu, bütün kliniklere yorum hakkı olur.
        $digerSahip = User::factory()->clinicOwner()->create();
        $digerKlinik = Clinic::factory()->create(['owner_id' => $digerSahip->id, 'is_active' => true]);
        $digerHekim = User::factory()->doctor()->create(['clinic_id' => $digerKlinik->id]);

        $randevu = $this->randevu(['clinic_id' => $digerKlinik->id, 'doctor_id' => $digerHekim->id]);

        $this->olarak($this->hasta)
            ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($randevu))
            ->assertStatus(403);

        $this->assertDatabaseCount('clinic_reviews', 0);
    }

    public function test_tamamlanmamis_randevuyla_yorum_yazilamiyor(): void
    {
        foreach (['pending', 'confirmed', 'cancelled'] as $durum) {
            ClinicReview::query()->delete();

            $randevu = $this->randevu(['status' => $durum]);

            $this->olarak($this->hasta)
                ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($randevu))
                ->assertStatus(403);

            $this->assertDatabaseCount('clinic_reviews', 0);
        }
    }

    public function test_ayni_klinige_ikinci_yorum_yazilamiyor(): void
    {
        $ilk = $this->randevu();
        $ikinci = $this->randevu();

        $this->olarak($this->hasta)
            ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($ilk))
            ->assertStatus(201);

        // İkinci randevu gerçek; kural "her randevuya bir yorum" değil,
        // "her kliniğe bir yorum".
        $this->olarak($this->hasta)
            ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($ikinci))
            ->assertStatus(409);

        $this->assertDatabaseCount('clinic_reviews', 1);
    }

    public function test_hasta_olmayan_yorum_yazamiyor(): void
    {
        $randevu = $this->randevu();

        foreach ([$this->hekim, $this->klinik->owner] as $yabanci) {
            $this->olarak($yabanci)
                ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($randevu))
                ->assertStatus(403);
        }

        $this->assertDatabaseCount('clinic_reviews', 0);
    }

    public function test_puan_sinirlarinin_disina_cikilamiyor(): void
    {
        $randevu = $this->randevu();

        foreach ([0, 6, -1, 99] as $puan) {
            $this->olarak($this->hasta)
                ->postJson("/api/clinics/{$this->klinik->id}/reviews", $this->yorumGovdesi($randevu, ['rating' => $puan]))
                ->assertStatus(422);
        }

        $this->assertDatabaseCount('clinic_reviews', 0);
    }
}
