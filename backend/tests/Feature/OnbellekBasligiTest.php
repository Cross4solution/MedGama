<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Önbellek başlıkları.
 *
 * Rotalar `cache.headers:public;max_age=60` yazıyor. Bu ifadenin tamamı tek
 * parametre olarak geldiği için tür bir dönem "public" ile eşleşmiyor, herkese
 * açık uçlar no-store çıkıyordu: CDN hiçbir şeyi tutmuyor, her ziyaretçi
 * isteği veritabanına kadar iniyordu. Sessiz bir hataydı — yanıt doğruydu,
 * yalnızca pahalıydı.
 */
class OnbellekBasligiTest extends TestCase
{
    use RefreshDatabase;

    public function test_herkese_acik_uc_cdn_tarafindan_onbelleklenebilir(): void
    {
        $yanit = $this->getJson('/api/doctors?per_page=5');
        $yanit->assertOk();

        $baslik = $yanit->headers->get('Cache-Control');

        $this->assertStringContainsString('public', $baslik, "Herkese açık uç no-store çıkıyor: {$baslik}");
        $this->assertStringNotContainsString('no-store', $baslik);
        $this->assertStringContainsString('s-maxage', $baslik, 'CDN önbellek süresi verilmemiş');
    }

    public function test_rotadaki_max_age_degeri_uygulaniyor(): void
    {
        // Rota `max_age=60` diyorsa başlıkta 60 görünmeli; yok sayılırsa
        // parametre çözülmüyor demektir.
        $yanit = $this->getJson('/api/catalog/specialties/search?q=kar');
        $yanit->assertOk();

        $this->assertStringContainsString('max-age=60', $yanit->headers->get('Cache-Control'));
    }

    public function test_kimlikli_istegin_yaniti_cdn_de_tutulmuyor(): void
    {
        // Aynı adres olsa bile kimliği doğrulanmış yanıt kişiye özeldir;
        // paylaşılan önbellekte tutulup başkasına verilemez.
        $hasta = User::factory()->patient()->create();

        $yanit = $this->actingAs($hasta, 'sanctum')->getJson('/api/doctors?per_page=5');
        $yanit->assertOk();

        $this->assertStringContainsString('no-store', $yanit->headers->get('Cache-Control'));
    }

    public function test_kisiye_ozel_uc_hicbir_zaman_onbelleklenmiyor(): void
    {
        $hasta = User::factory()->patient()->create();

        $yanit = $this->actingAs($hasta, 'sanctum')->getJson('/api/appointments');
        $yanit->assertOk();

        $this->assertStringContainsString('no-store', $yanit->headers->get('Cache-Control'));
    }
}
