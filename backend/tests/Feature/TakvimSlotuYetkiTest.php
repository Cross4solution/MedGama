<?php

namespace Tests\Feature;

use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Takvim slotları — hekimin randevu açtığı saatler.
 *
 * Bulunan hata: bu uçlarda SAHİPLİK DENETİMİ HİÇ YOKTU. `doctor_id` istekten
 * geliyor, istek sınıflarının `authorize()` metotları `true` dönüyor ve
 * servis yalnız `findOrFail($id)` yapıyordu. Uçtan ölçüldü:
 *
 *   • başkası adına slot açma      → 201
 *   • başkasının slotunu kapatma   → 200, is_available false oldu
 *
 * İkincisi rakibin takvimini dolu göstermek demek: hasta o hekimden randevu
 * alamaz, hekim de bir şeyin yanlış olduğunu göremez. Sessiz zarar.
 *
 * Ayrı bir hata: silme 200 dönüyor ama slotu silmiyordu — `is_active`
 * $fillable içinde olmadığı için `update()` onu eliyordu.
 */
class TakvimSlotuYetkiTest extends TestCase
{
    use RefreshDatabase;

    private User $sahipHekim;
    private User $yabanciHekim;
    private CalendarSlot $slot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sahipHekim = User::factory()->doctor()->create(['is_verified' => true]);
        $this->yabanciHekim = User::factory()->doctor()->create(['is_verified' => true]);

        $this->slot = $this->slotAc($this->sahipHekim, '10:00');
    }

    private function slotAc(User $hekim, string $saat): CalendarSlot
    {
        return CalendarSlot::create([
            'doctor_id'        => $hekim->id,
            'slot_date'        => now()->addDays(3)->toDateString(),
            'start_time'       => $saat,
            'duration_minutes' => 30,
            'is_available'     => true,
            'is_active'        => true,
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    // ── Pozitif kontroller ──

    public function test_hekim_kendi_slotunu_acabiliyor(): void
    {
        // Olmazsa aşağıdaki ret testleri, uç tümden kapalı olduğu için de
        // geçerdi.
        $this->olarak($this->sahipHekim)
            ->postJson('/api/calendar-slots', [
                'doctor_id'  => $this->sahipHekim->id,
                'slot_date'  => now()->addDays(4)->toDateString(),
                'start_time' => '09:00',
            ])
            ->assertStatus(201);
    }

    public function test_hekim_kendi_slotunu_kapatabiliyor(): void
    {
        $this->olarak($this->sahipHekim)
            ->putJson("/api/calendar-slots/{$this->slot->id}", ['is_available' => false])
            ->assertOk();

        $this->assertFalse((bool) $this->slot->fresh()->is_available);
    }

    // ── Yabancı hekim ──

    public function test_yabanci_hekim_baskasi_adina_slot_acamiyor(): void
    {
        $this->olarak($this->yabanciHekim)
            ->postJson('/api/calendar-slots', [
                'doctor_id'  => $this->sahipHekim->id,
                'slot_date'  => now()->addDays(5)->toDateString(),
                'start_time' => '11:00',
            ])
            ->assertStatus(403);

        $this->assertSame(
            1,
            CalendarSlot::where('doctor_id', $this->sahipHekim->id)->count(),
            'yabancı hekim kurbanın takvimine slot ekledi',
        );
    }

    public function test_yabanci_hekim_toplu_slot_da_acamiyor(): void
    {
        // Toplu uç ayrı bir istek sınıfı kullanıyor: tekli düzeltilip toplu
        // unutulursa açık aynen sürer.
        $this->olarak($this->yabanciHekim)
            ->postJson('/api/calendar-slots/bulk', [
                'doctor_id' => $this->sahipHekim->id,
                'slots'     => [
                    ['slot_date' => now()->addDays(6)->toDateString(), 'start_time' => '13:00'],
                ],
            ])
            ->assertStatus(403);

        $this->assertSame(1, CalendarSlot::where('doctor_id', $this->sahipHekim->id)->count());
    }

    public function test_yabanci_hekim_baskasinin_slotunu_kapatamiyor(): void
    {
        // ASIL ZARAR: rakibin takvimi dolu görünür, hasta randevu alamaz.
        $this->olarak($this->yabanciHekim)
            ->putJson("/api/calendar-slots/{$this->slot->id}", ['is_available' => false])
            ->assertStatus(403);

        $this->assertTrue(
            (bool) $this->slot->fresh()->is_available,
            'yabancı hekim kurbanın slotunu kapattı',
        );
    }

    public function test_yabanci_hekim_baskasinin_slotunu_silemiyor(): void
    {
        $this->olarak($this->yabanciHekim)
            ->deleteJson("/api/calendar-slots/{$this->slot->id}")
            ->assertStatus(403);

        $this->assertTrue((bool) $this->slot->fresh()->is_active, 'yabancı hekim slotu sildi');
    }

    public function test_yabanci_hekim_slot_saatini_degistiremiyor(): void
    {
        // Saati kaydırmak da sessiz bir sabotaj: hasta beklediği saatte
        // gelmez.
        $this->olarak($this->yabanciHekim)
            ->putJson("/api/calendar-slots/{$this->slot->id}", ['start_time' => '23:00'])
            ->assertStatus(403);

        $this->assertStringStartsWith('10:00', (string) $this->slot->fresh()->start_time);
    }

    // ── Silme gerçekten siliyor ──

    public function test_silme_slotu_gercekten_kaldiriyor(): void
    {
        // Uç 200 dönüyordu ama slot duruyordu: `is_active` $fillable içinde
        // olmadığı için `update()` alanı eliyordu. Hekim slotu kaldırdığını
        // sanıp randevu almaya devam ediyordu.
        $this->olarak($this->sahipHekim)
            ->deleteJson("/api/calendar-slots/{$this->slot->id}")
            ->assertOk();

        $this->assertFalse(
            (bool) $this->slot->fresh()->is_active,
            'silme başarılı dedi ama slot aktif kaldı',
        );
    }

    public function test_silinen_slot_listede_gorunmuyor(): void
    {
        // Sonucu kullanıcının gördüğü yerden de doğrula.
        $this->olarak($this->sahipHekim)
            ->deleteJson("/api/calendar-slots/{$this->slot->id}")
            ->assertOk();

        $this->assertStringNotContainsString(
            $this->slot->id,
            $this->olarak($this->sahipHekim)
                ->getJson('/api/calendar-slots?doctor_id=' . $this->sahipHekim->id)
                ->assertOk()->getContent(),
            'silinen slot listede kaldı',
        );
    }

    // ── Klinik sahibi ──

    public function test_klinik_sahibi_kendi_hekiminin_slotunu_yonetebiliyor(): void
    {
        // Ters uç: yetki fazla dar olsaydı klinik kendi takvimini yönetemezdi.
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $klinikHekimi = User::factory()->doctor()->create([
            'clinic_id'   => $klinik->id,
            'is_verified' => true,
        ]);
        $klinikSlotu = $this->slotAc($klinikHekimi, '14:00');

        $this->olarak($sahip)
            ->putJson("/api/calendar-slots/{$klinikSlotu->id}", ['is_available' => false])
            ->assertOk();
    }

    public function test_klinik_sahibi_yabanci_hekimin_slotunu_yonetemiyor(): void
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $this->olarak($sahip)
            ->putJson("/api/calendar-slots/{$this->slot->id}", ['is_available' => false])
            ->assertStatus(403);

        $this->assertTrue((bool) $this->slot->fresh()->is_available);
    }

    public function test_kliniksiz_klinik_sahibi_yonetemiyor(): void
    {
        // Boş klinik bağı "hepsi" anlamına gelmemeli — bu kod tabanında beş
        // sızıntı çıkaran desen.
        $sahip = User::factory()->clinicOwner()->create(['clinic_id' => null]);

        $this->olarak($sahip)
            ->putJson("/api/calendar-slots/{$this->slot->id}", ['is_available' => false])
            ->assertStatus(403);
    }
}
