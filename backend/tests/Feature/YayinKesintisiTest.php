<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\ChatConversation;
use App\Models\User;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Contracts\Broadcasting\Broadcaster;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Tests\TestCase;

/**
 * Yayın sunucusu kesintisi işi durdurmamalı.
 *
 * Bütün yayın olayları `ShouldBroadcastNow` — istek içinde, eşzamanlı
 * gönderiliyor. Yayın sunucusuna ulaşılamadığında Pusher istemcisi istisna
 * fırlatıyordu ve İŞLEM BAŞARISIZ SAYILIYORDU.
 *
 * Yerel yığında ölçüldü: yayın sunucusu kapalıyken hasta randevu
 * oluşturunca uç 500 döndü —
 *
 *     Pusher error: cURL error 7: Failed to connect to 0.0.0.0 port 6001
 *
 * ama randevu veritabanına YAZILMIŞTI. Hasta hata görüyor, tekrar deniyor;
 * mükerrer kayıt riski. Aynısı sohbet mesajında da vardı.
 *
 * Canlıda yayın sunucusu ayrı bir makinede (OVH). Kısa bir kesinti randevu
 * ve mesajlaşmayı durdurmamalı: yayın bir BİLDİRİM, işin kendisi değil.
 * Kaybolursa kullanıcı sayfayı yenilediğinde veriyi zaten görüyor.
 *
 * Test, yayıncıyı istisna fırlatacak şekilde değiştiriyor — gerçek kesintiyi
 * taklit etmenin tek güvenilir yolu bu; sunucuyu kapatıp açmak testte
 * mümkün değil.
 */
class YayinKesintisiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Her yayın denemesi patlasın.
        $bozuk = new class implements Broadcaster {
            public function auth($request) { return true; }
            public function validAuthenticationResponse($request, $result) { return $result; }
            public function broadcast(array $channels, $event, array $payload = [])
            {
                throw new BroadcastException('Yayın sunucusuna ulaşılamıyor (test)');
            }
        };

        Broadcast::extend('bozuk', fn () => $bozuk);
        config(['broadcasting.default' => 'bozuk', 'broadcasting.connections.bozuk' => ['driver' => 'bozuk']]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_yayin_kapaliyken_randevu_olusturulabiliyor(): void
    {
        $hasta = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);

        // `inPerson`: fabrikadaki hekim çevrimiçi görüşme sunmuyor ve
        // 'online' göndermek yayın denetimine hiç gelmeden 422 veriyor.
        $yanit = $this->olarak($hasta)->postJson('/api/appointments', [
            'patient_id'       => $hasta->id,
            'doctor_id'        => $doktor->id,
            'appointment_type' => 'inPerson',
            'appointment_date' => now()->addDays(10)->toDateString(),
            'appointment_time' => '15:30',
        ]);

        $this->assertSame(201, $yanit->getStatusCode(), 'yayın kesintisi randevuyu düşürdü');
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
        ]);
    }

    public function test_yayin_kapaliyken_randevu_iptal_edilebiliyor(): void
    {
        // İptal de yayın yapıyor; biri düzeltilip öbürü unutulabilir.
        $hasta = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);
        $randevu = Appointment::factory()->confirmed()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
        ]);

        $this->olarak($hasta)
            ->putJson("/api/appointments/{$randevu->id}/cancel")
            ->assertOk();

        $this->assertSame('cancelled', $randevu->fresh()->status);
    }

    public function test_yayin_kapaliyken_sohbet_mesaji_gonderilebiliyor(): void
    {
        $hasta = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);
        $sohbet = ChatConversation::findOrCreateBetween($hasta->id, $doktor->id);

        $this->olarak($doktor)
            ->postJson("/api/chat/conversations/{$sohbet->id}/messages", [
                'content' => 'Merhaba, sonuclariniz hazir.',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('chat_messages', ['sender_id' => $doktor->id]);
    }

    public function test_yayin_kapaliyken_okundu_isaretlenebiliyor(): void
    {
        $hasta = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);
        $sohbet = ChatConversation::findOrCreateBetween($hasta->id, $doktor->id);

        $this->olarak($doktor)
            ->postJson("/api/chat/conversations/{$sohbet->id}/messages", ['content' => 'Merhaba.'])
            ->assertStatus(201);

        $this->olarak($hasta)
            ->postJson("/api/chat/conversations/{$sohbet->id}/read")
            ->assertOk();
    }

    public function test_yayin_kapaliyken_yaziyor_bildirimi_istegi_dusurmuyor(): void
    {
        $hasta = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);
        $sohbet = ChatConversation::findOrCreateBetween($hasta->id, $doktor->id);

        $this->olarak($doktor)
            ->postJson("/api/chat/conversations/{$sohbet->id}/typing", ['is_typing' => true])
            ->assertOk();
    }

    public function test_yayin_kapaliyken_slot_rezervasyonu_tamamlaniyor(): void
    {
        // Slotlu randevu ayrı bir yol: kilitleme ve yayın birlikte çalışıyor.
        $hasta = User::factory()->patient()->create();
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);
        $slot = CalendarSlot::create([
            'doctor_id'        => $doktor->id,
            'slot_date'        => now()->addDays(7)->toDateString(),
            'start_time'       => '09:00',
            'duration_minutes' => 30,
            'is_available'     => true,
        ]);

        $this->olarak($hasta)->postJson('/api/appointments', [
            'patient_id'       => $hasta->id,
            'doctor_id'        => $doktor->id,
            'appointment_type' => 'inPerson',
            'slot_id'          => $slot->id,
            'appointment_date' => $slot->slot_date->format('Y-m-d'),
            'appointment_time' => '09:00',
        ])->assertStatus(201);

        $this->assertFalse((bool) $slot->fresh()->is_available, 'slot rezerve edilmedi');
    }
}
