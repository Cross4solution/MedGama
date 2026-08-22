<?php

namespace Tests\Feature;

use App\Models\CalendarSlot;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /api/doctors/{id}/availability — hastanın randevu saatlerini gördüğü uç.
 *
 * Giriş gerektirmiyor ve randevu akışının başlangıcı.
 *
 * Bulunan hata: sorgu `is_available` denetliyordu ama `is_active`
 * denetlemiyordu. Hekim slotu kaldırdıktan sonra da saat listede görünmeye
 * devam ediyordu.
 *
 * Zararın SINIRINI da ölçtüm: randevu oluşturma yolu `CalendarSlot::active()`
 * kullanıyor, yani silinen slot gerçekten rezerve EDİLEMİYOR. Hayalet randevu
 * oluşmuyor — hasta olmayan bir saati seçip randevu anında hata alıyor.
 * Sessiz bir veri sorunu değil, sessiz bir kullanıcı sorunu: hekim de neden
 * randevu gelmediğini göremiyor.
 */
class DoktorMusaitligiTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->doktor = User::factory()->doctor()->create(['is_verified' => true]);
        DoctorProfile::create([
            'user_id'   => $this->doktor->id,
            'specialty' => 'Kardiyoloji',
            'slug'      => 'dr-' . substr($this->doktor->id, 0, 8),
        ]);
    }

    private function slotAc(array $ek = []): CalendarSlot
    {
        return CalendarSlot::create(array_merge([
            'doctor_id'        => $this->doktor->id,
            'slot_date'        => now()->addDays(3)->toDateString(),
            'start_time'       => '10:00',
            'duration_minutes' => 30,
            'is_available'     => true,
            'is_active'        => true,
        ], $ek));
    }

    private function musaitlik(): array
    {
        return $this->getJson("/api/doctors/{$this->doktor->id}/availability")
            ->assertOk()->json('availability') ?? [];
    }

    private function slotSayisi(): int
    {
        $n = 0;
        foreach ($this->musaitlik() as $gun) {
            $n += count($gun);
        }

        return $n;
    }

    public function test_acik_slot_musaitlikte_gorunuyor(): void
    {
        // Pozitif kontrol: uç hiç slot döndürmüyorsa aşağıdaki testler
        // hiçbir şey kanıtlamaz.
        $this->slotAc();

        $this->assertSame(1, $this->slotSayisi(), 'açık slot müsaitlikte görünmedi');
    }

    public function test_silinen_slot_musaitlikte_gorunmuyor(): void
    {
        $slot = $this->slotAc();
        $slot->forceFill(['is_active' => false])->save();

        $this->assertSame(0, $this->slotSayisi(), 'silinen slot müsaitlikte kaldı');
    }

    public function test_rezerve_edilen_slot_gorunmuyor(): void
    {
        $slot = $this->slotAc();
        $slot->update(['is_available' => false]);

        $this->assertSame(0, $this->slotSayisi(), 'dolu slot müsait gösterildi');
    }

    public function test_silinen_slot_randevuya_da_kapali(): void
    {
        // Görüntüleme düzeltildi; rezervasyon yolunun da kapalı olduğunu
        // ayrıca doğrula — ikisi farklı sorgular ve biri düzeltilip öbürü
        // unutulabilir.
        $slot = $this->slotAc();
        $slot->forceFill(['is_active' => false])->save();

        $hasta = User::factory()->patient()->create();
        $jeton = $hasta->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        $yanit = $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->postJson('/api/appointments', [
                'doctor_id'        => $this->doktor->id,
                'appointment_type' => 'inPerson',
                'slot_id'          => $slot->id,
                'appointment_date' => $slot->slot_date->format('Y-m-d'),
                'appointment_time' => '10:00',
            ]);

        $this->assertNotSame(201, $yanit->getStatusCode(), 'silinen slot rezerve edildi');
        $this->assertDatabaseMissing('appointments', ['slot_id' => $slot->id]);
    }

    public function test_gecmis_tarihli_slot_listede_yok(): void
    {
        // Varsayılan pencere bugünden başlıyor; geçmiş saat gösterilirse
        // hasta boşuna deneme yapar.
        $this->slotAc(['slot_date' => now()->subDays(5)->toDateString()]);

        $this->assertSame(0, $this->slotSayisi(), 'geçmiş tarihli slot listelendi');
    }

    public function test_baska_hekimin_slotu_karismıyor(): void
    {
        $baskaHekim = User::factory()->doctor()->create(['is_verified' => true]);
        CalendarSlot::create([
            'doctor_id'        => $baskaHekim->id,
            'slot_date'        => now()->addDays(3)->toDateString(),
            'start_time'       => '11:00',
            'duration_minutes' => 30,
            'is_available'     => true,
            'is_active'        => true,
        ]);

        $this->assertSame(0, $this->slotSayisi(), 'başka hekimin slotu bu hekimde göründü');
    }

    public function test_musaitlik_hasta_bilgisi_sizdirmiyor(): void
    {
        // Uç giriş gerektirmiyor: yalnız saat bilgisi dönmeli, rezerve eden
        // kişiye dair hiçbir şey değil.
        $this->slotAc();

        $ham = $this->getJson("/api/doctors/{$this->doktor->id}/availability")
            ->assertOk()->getContent();

        foreach (['patient', 'email', 'mobile', 'fullname'] as $alan) {
            $this->assertStringNotContainsString($alan, $ham, "müsaitlik yanıtında {$alan} alanı var");
        }
    }
}
