<?php
namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\ChatMessage;
use App\Models\Invoice;
use App\Models\User;
use App\Services\DemoAccountService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DemoHastaTest extends TestCase
{
    use RefreshDatabase;

    public function test_hasta_demosu_dolu_ekranlarla_kurulur(): void
    {
        $hasta = app(DemoAccountService::class)->hazirla('patient');

        $this->assertNotNull($hasta, 'hasta hesabi kurulamadi');
        $this->assertSame('patient', $hasta->role_id);
        $this->assertSame(3, Appointment::where('patient_id', $hasta->id)->count());
        $this->assertSame(2, Invoice::where('patient_id', $hasta->id)->count());
        $this->assertSame(2, ChatMessage::whereNull('read_at')->count());
        $this->assertSame(3, DB::table('notifications')->where('notifiable_id', $hasta->id)->whereNull('read_at')->count());
    }

    /**
     * Sohbet önizlemesi şifreli saklanıyor: şifrelenmiş metin özgün
     * uzunluğun katı oluyordu ve varchar(255) sütuna sığmıyordu. Uzunca bir
     * mesaj yazan gerçek kullanıcıda da sohbet kaydı düşüyordu.
     */
    public function test_uzun_mesaj_onizlemesi_kaydedilir(): void
    {
        $doktor = User::factory()->doctor()->create();
        $hasta  = User::factory()->create(['role_id' => 'patient']);
        $uzun   = str_repeat('Tahlil sonuçlarınızı ayrıntılı inceledim. ', 6);

        $sohbet = \App\Models\ChatConversation::create([
            'user_one_id'          => $doktor->id,
            'user_two_id'          => $hasta->id,
            'last_message_at'      => now(),
            'last_message_content' => $uzun,
            'last_message_type'    => 'text',
            'last_message_sender_id' => $doktor->id,
            'is_active'            => true,
        ]);

        $this->assertSame($uzun, $sohbet->fresh()->last_message_content);
    }

    public function test_ikinci_giriste_veri_cogalmaz(): void
    {
        $s = app(DemoAccountService::class);
        $hasta = $s->hazirla('patient');
        $s->hazirla('patient');

        $this->assertSame(3, Appointment::where('patient_id', $hasta->id)->count());
    }
}
