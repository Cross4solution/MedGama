<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Tüm cihazlardan çıkış.
 *
 * Çıkış yalnızca isteği yapan cihazın jetonunu siliyordu; ortak bir
 * bilgisayarda açık kalan oturumu kapatmanın yolu yoktu. Hasta verisine
 * erişen bir hesapta bu gerçek bir açıktı.
 */
class LogoutAllDevicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_tum_oturumlar_kapanir(): void
    {
        $kullanici = User::factory()->doctor()->create();

        // Üç ayrı cihazdan girilmiş gibi.
        $kullanici->createToken('telefon');
        $kullanici->createToken('tablet');
        $kullanici->createToken('klinik-bilgisayari');

        $this->assertSame(3, $kullanici->tokens()->count());

        Sanctum::actingAs($kullanici);
        $this->postJson('/api/auth/logout-all')->assertOk();

        $this->assertSame(0, $kullanici->tokens()->count());
    }

    /** Başkasının oturumlarına dokunulmamalı. */
    public function test_baska_kullanicinin_oturumlari_etkilenmez(): void
    {
        $kullanici = User::factory()->doctor()->create();
        $kullanici->createToken('telefon');

        $baskasi = User::factory()->doctor()->create();
        $baskasi->createToken('telefon');

        Sanctum::actingAs($kullanici);
        $this->postJson('/api/auth/logout-all')->assertOk();

        $this->assertSame(0, $kullanici->tokens()->count());
        $this->assertSame(1, $baskasi->tokens()->count());
    }

    public function test_giris_yapmamis_kullanici_cagiramaz(): void
    {
        $this->postJson('/api/auth/logout-all')->assertStatus(401);
    }
}
