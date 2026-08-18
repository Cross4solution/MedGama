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

    public function test_ikinci_giriste_veri_cogalmaz(): void
    {
        $s = app(DemoAccountService::class);
        $hasta = $s->hazirla('patient');
        $s->hazirla('patient');

        $this->assertSame(3, Appointment::where('patient_id', $hasta->id)->count());
    }
}
