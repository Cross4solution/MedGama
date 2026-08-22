<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\HealthDataAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Sağlık verime kim baktı?" — erişim kayıtları.
 *
 * KVKK md. 11 ve GDPR md. 15 kapsamında kişinin kendi verisine yapılan
 * erişimleri görme hakkı var; bu uç o hakkı karşılıyor. Testi yoktu.
 *
 * Kaydın kendisi hassas: içinde kimin hangi hastanın hangi kaydına baktığı
 * yazıyor. Kapsam kırılırsa bir hasta, başka hastaların doktor ziyaretlerini
 * okuyabilir — yani hakkı sağlayan uç, ihlalin kaynağı olur.
 *
 * Sınananlar:
 *   • Hasta YALNIZCA kendi verisine yapılan erişimleri görüyor.
 *   • Kendi kendine erişim listede yok (gürültü).
 *   • Yönetici hasta kimliğiyle süzebiliyor.
 *   • Oturumsuz erişim yok.
 */
class SaglikErisimKaydiTest extends TestCase
{
    use RefreshDatabase;

    private function doktor(): User
    {
        $klinik = Clinic::factory()->create();

        return User::factory()->doctor()->create([
            'clinic_id'   => $klinik->id,
            'is_verified' => true,
        ]);
    }

    public function test_hasta_yalnizca_kendi_kayitlarini_goruyor(): void
    {
        $benim   = User::factory()->patient()->create();
        $baskasi = User::factory()->patient()->create();
        $doktor  = $this->doktor();

        HealthDataAuditLog::log(
            accessorId: $doktor->id, patientId: $benim->id,
            resourceType: 'examination', resourceId: 'BENIM-KAYDIM',
        );
        HealthDataAuditLog::log(
            accessorId: $doktor->id, patientId: $baskasi->id,
            resourceType: 'examination', resourceId: 'BASKASININ-KAYDI',
        );

        // Yanıt resource_id alanını döndürmüyor; ölçüt kayıt SAYISI ve
        // erişen kişinin kimliği. İlk yazışta resource_id aranıyordu ve
        // yanıtta hiç bulunmadığı için test yanlış yere düşüyordu.
        $yanit = $this->actingAs($benim, 'sanctum')
            ->getJson('/api/health-access-logs')
            ->assertOk();

        $this->assertSame(1, $yanit->json('total'), 'Hastaya ait olmayan kayıt da listelenmiş');
        $this->assertSame($doktor->id, $yanit->json('data.0.accessor.id'));
    }

    public function test_hastanin_kendi_erisimi_listede_gorunmuyor(): void
    {
        $hasta = User::factory()->patient()->create();

        HealthDataAuditLog::log(
            accessorId: $hasta->id, patientId: $hasta->id,
            resourceType: 'archive', resourceId: 'KENDI-BAKISIM',
        );

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/health-access-logs')
            ->assertOk();

        // Kişinin kendi arşivine bakması listeyi doldurup asıl bilgiyi
        // (başkasının baktığı anları) görünmez kılıyordu.
        $this->assertSame(0, $yanit->json('total'), 'Kendi erişimi listede görünüyor');
    }

    public function test_baskasinin_erisimi_listede_gorunuyor(): void
    {
        $hasta  = User::factory()->patient()->create();
        $doktor = $this->doktor();

        HealthDataAuditLog::log(
            accessorId: $doktor->id, patientId: $hasta->id,
            resourceType: 'examination', resourceId: 'DOKTOR-BAKTI',
        );

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/health-access-logs')
            ->assertOk();

        $this->assertSame(1, $yanit->json('total'), 'Doktorun erişimi listede yok');
        $this->assertSame($doktor->id, $yanit->json('data.0.accessor.id'));
    }

    public function test_yonetici_hasta_kimligiyle_suzebiliyor(): void
    {
        $yonetici = User::factory()->admin()->create();
        $hasta    = User::factory()->patient()->create();
        $digeri   = User::factory()->patient()->create();
        $doktor   = $this->doktor();

        HealthDataAuditLog::log(
            accessorId: $doktor->id, patientId: $hasta->id,
            resourceType: 'examination', resourceId: 'HEDEF-HASTA',
        );
        HealthDataAuditLog::log(
            accessorId: $doktor->id, patientId: $digeri->id,
            resourceType: 'examination', resourceId: 'DIGER-HASTA',
        );

        $yanit = $this->actingAs($yonetici, 'sanctum')
            ->getJson('/api/health-access-logs?patient_id=' . $hasta->id)
            ->assertOk();

        $this->assertSame(1, $yanit->json('total'), 'Süzgeç uygulanmamış');
        $this->assertSame($hasta->id, $yanit->json('data.0.patient.id'));
    }

    public function test_oturumsuz_erisim_kaydi_okunamiyor(): void
    {
        $this->getJson('/api/health-access-logs')->assertUnauthorized();
    }
}
