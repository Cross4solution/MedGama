<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sahte transkript üretimi üretimde kapalı kalmalı.
 *
 * `simulate-transcript` sabit bir listeden rastgele klinik cümle döndürüyor —
 * "Blood pressure is currently 130 over 85", "Let me prescribe a low-dose
 * aspirin" gibi. Yanlarında uydurma güven skoru ve saat damgası var. Ön yüz
 * bunları görüşme ekranında yanıp sönen kırmızı "REC" rozetiyle gösteriyordu.
 *
 * İki ayrı zarar: hekim söylenmemiş bir tansiyon ya da ilaç satırını görüşme
 * kaydı sanabilir, ve hastaya görüşmenin kaydedildiği söylenmiş olur — doğru
 * olmayan bir rıza beyanı.
 *
 * Uç geliştirmede duruyor (Deepgram bağlanana kadar arayüzü denemek için),
 * üretimde 404. Ön yüz tarafındaki eşi paraBirimiSecimi'nin yanındaki
 * telesaglikTranskripti.test.mjs.
 */
class TelesaglikTranskriptiTest extends TestCase
{
    use RefreshDatabase;

    private function randevu(): array
    {
        $hekim = User::factory()->create(['role_id' => 'doctor']);
        $hasta = User::factory()->create(['role_id' => 'patient']);

        $randevu = Appointment::factory()->create([
            'doctor_id'  => $hekim->id,
            'patient_id' => $hasta->id,
        ]);

        return [$hekim, $randevu];
    }

    public function test_uretimde_kapali(): void
    {
        [$hekim, $randevu] = $this->randevu();
        $this->app['env'] = 'production';

        $this->actingAs($hekim, 'sanctum')
            ->getJson("/api/telehealth/{$randevu->id}/simulate-transcript")
            ->assertStatus(404);
    }

    public function test_gelistirmede_calismaya_devam_ediyor(): void
    {
        // Aşırı kilitleyip arayüz denemesini büsbütün bozmadığımızın kanıtı.
        [$hekim, $randevu] = $this->randevu();

        $this->actingAs($hekim, 'sanctum')
            ->getJson("/api/telehealth/{$randevu->id}/simulate-transcript")
            ->assertOk()
            ->assertJsonPath('mode', 'simulation');
    }

    public function test_rota_uretim_kapisini_tasiyor(): void
    {
        // Kapı ara katmanda; rotadan düşerse test dosyası hâlâ yeşil kalır
        // ama uç canlıda açılır. Onun için tanımı da tutuyoruz.
        $rotalar = (string) file_get_contents(base_path('routes/api.php'));

        $this->assertMatchesRegularExpression(
            "/simulate-transcript.*\n.*UretimdeKapat/",
            $rotalar,
            'simulate-transcript rotası üretim kapısını taşımıyor',
        );
    }
}
