<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kullanıcı kendi yetkisini yükseltemez.
 *
 * `AuthService::updateProfile` gelen veriyi doğrudan `$user->update($data)`
 * ile yazıyor. Tek koruma iki halkalı ve ikisi de göze çarpmıyor:
 *
 *   1. Controller `$request->validated()` gönderiyor — `all()` değil.
 *   2. UpdateProfileRequest kuralları ayrıcalıklı alanları içermiyor.
 *
 * Biri kurallara `role_id` eklerse ya da `validated()` yerine `all()` yazarsa,
 * herhangi bir hasta tek bir profil güncellemesiyle süper yönetici olabilir.
 * Hiçbir yerde hata görünmez; yalnızca istek geçer.
 *
 * `role_id`, `user_level`, `is_verified` ve `mobile_verified` modelin
 * `fillable` listesinde OLDUĞU için kütle atama koruması burada devrede değil
 * — savunmanın tamamı doğrulama kurallarında.
 */
class YetkiYukseltmeTest extends TestCase
{
    use RefreshDatabase;

    private function hasta(): User
    {
        return User::factory()->patient()->create([
            'fullname'    => 'Ayşe Yılmaz',
            'is_verified' => false,
        ]);
    }

    public function test_hasta_kendini_yonetici_yapamiyor(): void
    {
        $hasta = $this->hasta();

        $this->actingAs($hasta, 'sanctum')
            ->putJson('/api/auth/profile', [
                'fullname' => 'Ayşe Yılmaz',
                'role_id'  => 'superAdmin',
            ]);

        $this->assertSame('patient', $hasta->fresh()->role_id, 'Hasta kendi rolünü yükseltti');
    }

    public function test_hasta_kendini_doktor_yapamiyor(): void
    {
        $hasta = $this->hasta();

        $this->actingAs($hasta, 'sanctum')
            ->putJson('/api/auth/profile', ['role_id' => 'doctor']);

        $this->assertSame('patient', $hasta->fresh()->role_id);
    }

    public function test_hasta_kendini_dogrulanmis_isaretleyemiyor(): void
    {
        $hasta = $this->hasta();

        $this->actingAs($hasta, 'sanctum')
            ->putJson('/api/auth/profile', ['is_verified' => true]);

        // "Doğrulanmış" rozeti hastaların doktor seçerken güvendiği işaret.
        $this->assertFalse((bool) $hasta->fresh()->is_verified);
    }

    public function test_hasta_kendine_crm_aboneligi_veremiyor(): void
    {
        $hasta = $this->hasta();

        $this->actingAs($hasta, 'sanctum')
            ->putJson('/api/auth/profile', [
                'is_crm_active'  => true,
                'crm_expires_at' => now()->addYear()->toDateTimeString(),
            ]);

        $this->assertFalse((bool) $hasta->fresh()->is_crm_active, 'Ücretli abonelik bedava alındı');
    }

    public function test_hasta_kendi_seviyesini_yukseltemiyor(): void
    {
        $hasta = $this->hasta();
        $seviye = $hasta->user_level;

        $this->actingAs($hasta, 'sanctum')
            ->putJson('/api/auth/profile', ['user_level' => 5]);

        $this->assertSame($seviye, $hasta->fresh()->user_level);
    }

    public function test_mesru_alanlar_guncellenebiliyor(): void
    {
        $hasta = $this->hasta();

        $this->actingAs($hasta, 'sanctum')
            ->putJson('/api/auth/profile', ['fullname' => 'Yeni Ad'])
            ->assertOk();

        // Pozitif kontrol: her şeyi reddeden bir uç da yukarıdaki testleri
        // geçerdi. Meşru güncellemenin çalıştığını görmek, reddin bir KARAR
        // olduğunu gösteriyor.
        $this->assertSame('Yeni Ad', $hasta->fresh()->fullname);
    }
}
