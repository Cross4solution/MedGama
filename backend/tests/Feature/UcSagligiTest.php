<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Uç sağlığı: hiçbir GET ucu sunucu hatası vermemeli.
 *
 * Bu test dokuz kırık ucu ortaya çıkardı. Hepsinin sebebi aynıydı: koda
 * PostgreSQL'e özgü SQL serpilmişti (TO_CHAR, ILIKE, ::timestamp) ve canlıdaki
 * TiDB bunları anlamıyordu. Hiçbiri testlerde de çalışmadığı için yıllarca
 * görünmediler — gelir raporu, klinik yönetimi ve okunmamış mesaj sayacı
 * canlıda 500 veriyordu.
 *
 * Rotalar tablodan OKUNUYOR, elle listelenmiyor: yarın eklenen bir uç bu
 * korumaya kendiliğinden dahil olur.
 *
 * Ölçüt bilinçli olarak gevşek: 401/403/404/422 hepsi geçerli yanıtlar —
 * yalnızca 5xx kabul edilmez. Sınanan şey "uç doğru veriyi döndürüyor mu"
 * değil, "çöküyor mu".
 */
class UcSagligiTest extends TestCase
{
    use RefreshDatabase;

    /** Yan etkisi olan veya uzun süren uçlar kapsam dışı. */
    private const ATLANACAK = ['init-db', 'demo-login', 'mail-preview', 'mail-status'];

    public function test_hicbir_get_ucu_sunucu_hatasi_vermiyor(): void
    {
        [$roller, $veri] = $this->ortamiKur();

        $bozuk = [];
        foreach ($this->getUclari() as $yol) {
            foreach ($roller as $rolAdi => $kullanici) {
                if ($kullanici) {
                    $this->actingAs($kullanici, 'sanctum');
                } else {
                    app('auth')->forgetGuards();
                }

                try {
                    $kod = $this->getJson($yol)->getStatusCode();
                } catch (\Throwable $e) {
                    $bozuk[] = "{$yol} [{$rolAdi}] → " . get_class($e) . ': ' . substr($e->getMessage(), 0, 120);
                    continue;
                }

                if ($kod >= 500) {
                    $bozuk[] = "{$yol} [{$rolAdi}] → HTTP {$kod}";
                }
            }
        }

        $this->assertSame(
            [],
            $bozuk,
            "Sunucu hatası veren uçlar:\n" . implode("\n", $bozuk),
        );
    }

    /** @return string[] */
    private function getUclari(): array
    {
        $uclar = [];

        foreach (Route::getRoutes() as $rota) {
            if (!in_array('GET', $rota->methods(), true)) {
                continue;
            }

            $uri = $rota->uri();

            // Parametreli uçlar dışarıda: uydurma kimlik 404 üretir, gerçek
            // kimlik üretmek her uç için ayrı kurulum demek olurdu.
            if (!str_starts_with($uri, 'api/') || str_contains($uri, '{')) {
                continue;
            }

            foreach (self::ATLANACAK as $atla) {
                if (str_contains($uri, $atla)) {
                    continue 2;
                }
            }

            $uclar[] = '/' . $uri;
        }

        return array_values(array_unique($uclar));
    }

    /** @return array{0: array<string,?User>, 1: array<string,mixed>} */
    private function ortamiKur(): array
    {
        $klinik = Clinic::factory()->create([
            'is_crm_active' => true, 'crm_expires_at' => now()->addYear(),
        ]);

        $doktor = User::factory()->doctor()->create([
            'clinic_id' => $klinik->id, 'is_crm_active' => true, 'crm_expires_at' => now()->addYear(),
        ]);
        $klinikSahibi = User::factory()->clinicOwner()->create([
            'clinic_id' => $klinik->id, 'is_crm_active' => true, 'crm_expires_at' => now()->addYear(),
        ]);
        $hasta = User::factory()->patient()->create();
        $yonetici = User::factory()->admin()->create();

        // Uçlar boş tabloda değil gerçek veriyle sınanmalı: bir toplama
        // sorgusunun bozuk olduğu ancak satır varken anlaşılır.
        Appointment::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
            'status' => 'completed', 'starts_at' => now()->subDay(), 'timezone' => 'Europe/Istanbul',
        ]);

        Invoice::create([
            'invoice_number' => 'US-1', 'patient_id' => $hasta->id, 'doctor_id' => $doktor->id,
            'clinic_id' => $klinik->id, 'subtotal' => 100, 'grand_total' => 100, 'paid_amount' => 100,
            'currency' => 'EUR', 'status' => 'paid', 'paid_at' => now(), 'issue_date' => now()->toDateString(),
        ]);

        MedStreamPost::factory()->create(['author_id' => $doktor->id]);

        return [[
            'misafir'  => null,
            'hasta'    => $hasta,
            'doktor'   => $doktor,
            'klinik'   => $klinikSahibi,
            'yonetici' => $yonetici,
        ], []];
    }
}
