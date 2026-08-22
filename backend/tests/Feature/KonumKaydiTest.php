<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kullanıcının konumu — kaydetme ve sınırlar.
 *
 * Konum kişisel veri: enlem/boylam, kişinin evini gösterecek hassasiyette.
 * Uç testsizdi.
 *
 * Sınananlar:
 *   • Konum gerçekten KAYDEDİLİYOR (fill() kullanıldığı için, alanlardan biri
 *     fillable olmasa sessizce yok sayılırdı — aynı tuzağa CRM alanlarında
 *     rastlanmıştı).
 *   • Geçersiz koordinat reddediliyor.
 *   • Kısmi güncelleme mevcut değerleri silmiyor.
 *   • Yazma yalnızca çağıranın kendi kaydına gidiyor.
 */
class KonumKaydiTest extends TestCase
{
    use RefreshDatabase;

    public function test_konum_kaydediliyor(): void
    {
        $kullanici = User::factory()->patient()->create();

        $this->actingAs($kullanici, 'sanctum')
            ->postJson('/api/geo/location', [
                'country'   => 'tr',
                'state'     => 'İstanbul',
                'latitude'  => 41.0082,
                'longitude' => 28.9784,
            ])
            ->assertOk();

        $sonra = $kullanici->fresh();
        $this->assertSame('TR', $sonra->country, 'Ülke kodu büyük harfe çevrilip kaydedilmedi');
        $this->assertSame('İstanbul', $sonra->state);
        $this->assertEqualsWithDelta(41.0082, (float) $sonra->latitude, 0.0001);
        $this->assertNotNull($sonra->location_updated_at);
    }

    public function test_gecersiz_koordinat_reddediliyor(): void
    {
        $kullanici = User::factory()->patient()->create();

        $this->actingAs($kullanici, 'sanctum')
            ->postJson('/api/geo/location', ['latitude' => 91, 'longitude' => 0])
            ->assertStatus(422)
            ->assertJsonValidationErrors('latitude');

        $this->actingAs($kullanici, 'sanctum')
            ->postJson('/api/geo/location', ['latitude' => 0, 'longitude' => 181])
            ->assertStatus(422)
            ->assertJsonValidationErrors('longitude');
    }

    public function test_kismi_guncelleme_mevcut_degeri_silmiyor(): void
    {
        $kullanici = User::factory()->patient()->create();

        $this->actingAs($kullanici, 'sanctum')
            ->postJson('/api/geo/location', [
                'country' => 'TR', 'state' => 'İzmir',
                'latitude' => 38.4, 'longitude' => 27.1,
            ])->assertOk();

        // Yalnızca ülke gönderiliyor: koordinatlar yerinde kalmalı. Aksi hâlde
        // ülke seçimi kullanıcının konumunu sessizce siler.
        $this->actingAs($kullanici, 'sanctum')
            ->postJson('/api/geo/location', ['country' => 'DE'])
            ->assertOk();

        $sonra = $kullanici->fresh();
        $this->assertSame('DE', $sonra->country);
        $this->assertEqualsWithDelta(38.4, (float) $sonra->latitude, 0.0001, 'Kısmi güncelleme koordinatı sildi');
        $this->assertSame('İzmir', $sonra->state);
    }

    public function test_yazma_baska_kullaniciya_gecmiyor(): void
    {
        $kullanici = User::factory()->patient()->create();
        $digeri = User::factory()->patient()->create(['country' => 'FR']);

        $this->actingAs($kullanici, 'sanctum')
            ->postJson('/api/geo/location', ['country' => 'TR'])
            ->assertOk();

        $this->assertSame('FR', $digeri->fresh()->country, 'Başka kullanıcının konumu değişmiş');
    }

    public function test_oturumsuz_konum_kaydedilemiyor(): void
    {
        $this->postJson('/api/geo/location', ['country' => 'TR'])->assertUnauthorized();
    }
}
