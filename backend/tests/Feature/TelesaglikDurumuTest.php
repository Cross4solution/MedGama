<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Görüşme durumu — `PUT /api/telehealth/{appointmentId}/status`.
 *
 * Kapsanmayan yazma uçlarından biri. Bu uç bir randevunun `meeting_status`
 * alanını değiştiriyor: görüşme başladı, bitti ya da başarısız oldu. Kapı tek
 * bir yardımcıya bakıyor (`authorizeParticipant`) ve o yardımcı kaldırılsa uç
 * 200 dönmeye devam eder — yalnız artık herhangi bir oturum sahibi, tanımadığı
 * iki kişinin görüşmesini "tamamlandı" işaretleyebilir.
 *
 * Bunun somut sonucu var: durum `completed` olduğunda görüşme odası siliniyor.
 * Yani yabancı biri, süren bir hekim-hasta görüşmesini dışarıdan kapatabilirdi.
 */
class TelesaglikDurumuTest extends TestCase
{
    use RefreshDatabase;

    private User $hekim;
    private User $hasta;
    private Appointment $randevu;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $this->hasta = User::factory()->patient()->create();

        $this->randevu = Appointment::factory()->create([
            'doctor_id'        => $this->hekim->id,
            'patient_id'       => $this->hasta->id,
            'status'           => 'confirmed',
            'appointment_type' => 'online',
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function durumaCek(User $user, string $durum)
    {
        return $this->olarak($user)
            ->putJson("/api/telehealth/{$this->randevu->id}/status", ['meeting_status' => $durum]);
    }

    public function test_katilimcilar_durumu_degistirebiliyor(): void
    {
        $this->durumaCek($this->hekim, 'in_progress')->assertOk();
        $this->assertSame('in_progress', $this->randevu->fresh()->meeting_status);

        // Hasta da katılımcı: görüşmeyi kendi tarafından bitirebilmeli.
        $this->durumaCek($this->hasta, 'completed')->assertOk();
        $this->assertSame('completed', $this->randevu->fresh()->meeting_status);
    }

    public function test_yabanci_gorusmeyi_kapatamiyor(): void
    {
        $this->randevu->update(['meeting_status' => 'in_progress']);

        foreach ([
            User::factory()->doctor()->create(['is_verified' => true]),
            User::factory()->patient()->create(),
            User::factory()->clinicOwner()->create(),
        ] as $yabanci) {
            $this->durumaCek($yabanci, 'completed')->assertStatus(403);
        }

        $this->assertSame(
            'in_progress',
            $this->randevu->fresh()->meeting_status,
            'yabancı, süren bir görüşmeyi dışarıdan kapatabildi',
        );
    }

    public function test_oturumsuz_istek_reddediliyor(): void
    {
        $this->putJson("/api/telehealth/{$this->randevu->id}/status", ['meeting_status' => 'completed'])
            ->assertStatus(401);
    }

    public function test_tanimsiz_durum_kabul_edilmiyor(): void
    {
        // Serbest metin kabul edilseydi `meeting_status` anlamını yitirir,
        // ona bakan her ekran sessizce yanlış dal seçerdi.
        foreach (['cancelled', 'silinmis', '', 'COMPLETED'] as $durum) {
            $this->durumaCek($this->hekim, $durum)->assertStatus(422);
        }

        // Varsayılan `pending`; reddedilen istek onu değiştirmemiş olmalı.
        $this->assertSame('pending', $this->randevu->fresh()->meeting_status);
    }

    public function test_var_olmayan_randevu_404(): void
    {
        $this->olarak($this->hekim)
            ->putJson('/api/telehealth/' . \Illuminate\Support\Str::uuid() . '/status', [
                'meeting_status' => 'completed',
            ])
            ->assertStatus(404);
    }
}
