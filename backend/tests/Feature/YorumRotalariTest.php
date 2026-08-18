<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Sabit yollar joker rotanın altında kalmamalı.
 *
 * `/doctors/{id}` daha üstte tanımlıyken `/doctors/my-reviews` isteği
 * "my-reviews" kimlikli doktor araması olarak eşleşiyor ve 404 dönüyordu:
 * doktorun kendi yorumları ve "yorum yazılabilir randevular" ekranları
 * hiç açılmıyordu.
 */
class YorumRotalariTest extends TestCase
{
    use RefreshDatabase;

    public function test_doktorun_kendi_yorumlari_ucu_calisiyor(): void
    {
        $doktor = User::factory()->doctor()->create();
        Sanctum::actingAs($doktor);

        $this->getJson('/api/doctors/my-reviews')->assertOk();
    }

    public function test_yorum_yazilabilir_randevular_ucu_calisiyor(): void
    {
        $hasta = User::factory()->create(['role_id' => 'patient']);
        Sanctum::actingAs($hasta);

        $this->getJson('/api/doctors/reviewable-appointments')->assertOk();
        $this->getJson('/api/clinics/reviewable-appointments')->assertOk();
    }
}
