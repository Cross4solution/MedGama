<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\NotificationPreferences;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /api/translation/status — içerik çevirisi anahtarının okunduğu uç.
 *
 * Bu uç herkese açık kalmalı (giriş yapmamış kullanıcı da düğmeyi görebilmeli)
 * AMA jeton geldiğinde kullanıcıyı çözmeli. Rota düz açık bırakıldığında
 * $request->user() null geliyor ve uç GİRİŞ YAPMIŞ HERKESE `enabled: false`
 * diyordu: tercih doğru kaydediliyor, ekran hiç öğrenemiyordu.
 *
 * DİKKAT — actingAs KULLANILMIYOR: muhafazayı doğrudan kurduğu için
 * `optional.auth` silinse bile testler geçerdi. Ara katmanın işini yaptığını
 * ancak gerçek bir Bearer başlığı kanıtlıyor.
 */
class CeviriDurumuTest extends TestCase
{
    use RefreshDatabase;

    private function jetonlaIste(User $user): \Illuminate\Testing\TestResponse
    {
        $jeton = $user->createToken('test')->plainTextToken;

        // Önceki testlerden kalan çözülmüş muhafaza, Bearer başlığını gölgeler.
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/translation/status');
    }

    public function test_acik_tercih_jetonla_okunuyor(): void
    {
        $user = User::factory()->create([
            'preferred_language' => 'de',
            'notification_preferences' => array_merge(NotificationPreferences::AYARLAR, ['translate_content' => true]),
        ]);

        $this->jetonlaIste($user)
            ->assertOk()
            ->assertJsonPath('enabled', true)
            // Dil de aynı null-kullanıcı hatasından etkileniyordu: herkese 'en'.
            ->assertJsonPath('language', 'de');
    }

    public function test_kapali_tercih_kapali_bildiriliyor(): void
    {
        $user = User::factory()->create([
            'notification_preferences' => array_merge(NotificationPreferences::AYARLAR, ['translate_content' => false]),
        ]);

        $this->jetonlaIste($user)->assertOk()->assertJsonPath('enabled', false);
    }

    public function test_misafir_erisebiliyor_ve_kapali_goruyor(): void
    {
        // Uç açık kalmalı: 401 dönerse giriş yapmamış ziyaretçide ekran patlar.
        $this->getJson('/api/translation/status')
            ->assertOk()
            ->assertJsonPath('enabled', false);
    }
}
