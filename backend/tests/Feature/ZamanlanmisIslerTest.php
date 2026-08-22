<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\User;
use App\Notifications\AppointmentReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Zamanlanmış işler: otomatik tamamlama ve randevu hatırlatmaları.
 *
 * İkisi de zamanlayıcıda dakikalarla çalışıyor ve hiç test edilmemişti.
 * Bu tür işlerin arızası sessiz: kimse hata görmez, sadece hatırlatma
 * gitmez ya da randevu yanlış duruma geçer.
 *
 * Otomatik tamamlamada geçmişte gerçek bir hata yaşanmış: duvar saati sunucu
 * saatiyle karşılaştırıldığı için Türkiye randevuları üç saat erken
 * "tamamlandı" sayılıyormuş. Düzeltmesi mutlak an karşılaştırması; buradaki
 * test o düzeltmeyi yerinde tutuyor.
 */
class ZamanlanmisIslerTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: User, 2: Clinic} */
    private function taraflar(): array
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id, 'is_verified' => true]);
        $hasta  = User::factory()->patient()->create();

        return [$hasta, $doktor, $klinik];
    }

    private function randevu(array $ek = []): Appointment
    {
        [$hasta, $doktor, $klinik] = $this->taraflar();

        return Appointment::factory()->create(array_merge([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
            'clinic_id'  => $klinik->id,
            'status'     => 'confirmed',
            'timezone'   => 'Europe/Istanbul',
            'starts_at'  => now()->subHour(),
        ], $ek));
    }

    // ── Otomatik tamamlama ───────────────────────────────────────────

    public function test_saati_gecmis_onayli_randevu_tamamlaniyor(): void
    {
        $randevu = $this->randevu(['starts_at' => now()->subHour()]);

        Artisan::call('appointments:auto-complete');

        $this->assertSame('completed', $randevu->fresh()->status);
        $this->assertNotNull($randevu->fresh()->auto_completed_at);
    }

    public function test_gelecekteki_randevuya_dokunulmuyor(): void
    {
        $randevu = $this->randevu(['starts_at' => now()->addDay()]);

        Artisan::call('appointments:auto-complete');

        $this->assertSame('confirmed', $randevu->fresh()->status, 'Gelecekteki randevu tamamlandı sayıldı');
    }

    public function test_onaysiz_randevu_tamamlanmiyor(): void
    {
        // Hasta gelmemiş olabilir; onaylanmamış randevuyu "yapıldı" saymak
        // yorum yazma hakkı ve istatistik üretir.
        $bekleyen = $this->randevu(['status' => 'pending', 'starts_at' => now()->subHour()]);
        $iptal    = $this->randevu(['status' => 'cancelled', 'starts_at' => now()->subHour()]);

        Artisan::call('appointments:auto-complete');

        $this->assertSame('pending', $bekleyen->fresh()->status);
        $this->assertSame('cancelled', $iptal->fresh()->status);
    }

    public function test_ikinci_calisma_ayni_randevuyu_yeniden_islemiyor(): void
    {
        $randevu = $this->randevu(['starts_at' => now()->subHour()]);

        Artisan::call('appointments:auto-complete');
        $ilkDamga = $randevu->fresh()->auto_completed_at;

        Artisan::call('appointments:auto-complete');

        // Damga değişirse iş tekrarlanıyor demektir; 15 dakikada bir çalışan
        // bir görevde bu, aynı kaydı sonsuza kadar güncellemek olur.
        $this->assertEquals($ilkDamga, $randevu->fresh()->auto_completed_at);
    }

    public function test_saat_dilimi_erken_tamamlamaya_yol_acmiyor(): void
    {
        // Türkiye saatiyle bir saat SONRA başlayacak randevu. Duvar saati
        // sunucu saatiyle karşılaştırılırsa (eski hata) bu randevu üç saat
        // erken tamamlanmış sayılıyordu.
        $randevu = $this->randevu([
            'starts_at'        => now()->addHour(),
            'timezone'         => 'Europe/Istanbul',
            'appointment_date' => now()->addHour()->toDateString(),
            'appointment_time' => now()->addHour()->format('H:i'),
        ]);

        Artisan::call('appointments:auto-complete');

        $this->assertSame(
            'confirmed',
            $randevu->fresh()->status,
            'Saat dilimi farkı yüzünden randevu erken tamamlandı',
        );
    }

    // ── Hatırlatmalar ────────────────────────────────────────────────

    public function test_bir_saat_kala_iki_tarafa_da_hatirlatma_gidiyor(): void
    {
        Notification::fake();
        $randevu = $this->randevu(['starts_at' => now()->addHour()]);

        Artisan::call('appointments:send-reminders');

        // Hatırlatma tek tarafa değil, randevunun iki tarafına da gidiyor.
        Notification::assertSentTo(
            $randevu->patient,
            AppointmentReminderNotification::class,
        );
        Notification::assertSentTo(
            $randevu->doctor,
            AppointmentReminderNotification::class,
        );
    }

    public function test_uzaktaki_randevu_icin_hatirlatma_gitmiyor(): void
    {
        Notification::fake();
        // Ne 24 saat ne 1 saat penceresinde: altı saat sonrası.
        $this->randevu(['starts_at' => now()->addHours(6)]);

        Artisan::call('appointments:send-reminders');

        Notification::assertNothingSent();
    }

    public function test_iptal_edilen_randevuya_hatirlatma_gitmiyor(): void
    {
        Notification::fake();
        $this->randevu(['status' => 'cancelled', 'starts_at' => now()->addHour()]);

        Artisan::call('appointments:send-reminders');

        Notification::assertNothingSent();
    }
}
