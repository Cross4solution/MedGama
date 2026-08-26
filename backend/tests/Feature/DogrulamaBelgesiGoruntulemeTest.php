<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Yönetici, onaylayacağı hekim belgesini GERÇEKTEN görebiliyor mu?
 *
 * Doğrulama merkezinin tek işi bu: diplomaya ya da lisansa bakıp hekimi
 * onaylamak. İki ekran da belgeyi `<img src>` / `<iframe src>` ile
 * gösteriyordu ve adrese `?token=...` ekliyordu.
 *
 * İki ayrı şey birden yanlıştı:
 *
 *   1. Jeton `localStorage['auth_token']` anahtarından okunuyordu.
 *      Uygulama o ada hiç yazmıyor (`access_token` ve `auth_state` var),
 *      yani değer HER ZAMAN boştu.
 *   2. Dolu olsaydı bile işe yaramazdı: uç `auth:sanctum` arkasında ve
 *      jetonu `Authorization` başlığından okuyor. `<img>` ve `<iframe>`
 *      o başlığı göndermez, sorgudaki jeton da okunmuyor.
 *
 * Ölçüldü: `<img src>` biçimindeki istek 401, aynı uç başlıkla 200. Yani
 * yönetici onaylamaya çalıştığı belgeyi hiç göremiyordu — ve bu ekran,
 * uygulamadaki 93 sayfa içinde hiçbir testin uğramadığı TEK sayfaydı.
 *
 * Çözüm imzalı bağlantı DEĞİL: bu uç kimin baktığını denetime yazıyor
 * (`DenetimKaydiCagrilariTest`) ve imzalı istekte oturum sahibi olmaz.
 * Belge kimlikli istekle çekilip tarayıcıda blob adresine çevriliyor.
 */
class DogrulamaBelgesiGoruntulemeTest extends TestCase
{
    use RefreshDatabase;

    private function belge(): array
    {
        Storage::fake('local');

        $yonetici = User::factory()->create(['role_id' => 'superAdmin']);
        $hekim    = User::factory()->create(['role_id' => 'doctor']);

        Storage::disk('local')->put('vr/diploma.png', 'DIPLOMA-ICERIGI');

        $vr = VerificationRequest::create([
            'doctor_id'     => $hekim->id,
            'document_type' => 'diploma',
            'file_path'     => 'vr/diploma.png',
            'file_name'     => 'diploma.png',
            'mime_type'     => 'image/png',
            'status'        => 'pending',
        ]);

        return [$yonetici, $vr];
    }

    public function test_kimlikli_istek_belgeyi_getiriyor(): void
    {
        [$yonetici, $vr] = $this->belge();

        $yanit = $this->actingAs($yonetici, 'sanctum')
            ->get("/api/admin/verification-requests/{$vr->id}/document");

        $this->assertSame(200, $yanit->getStatusCode(), 'yönetici belgeyi göremiyor');
    }

    public function test_sorgudaki_jeton_kimlik_yerine_gecmiyor(): void
    {
        // Bu ölçütün işi bir GÜVENLİK sınırını tutmak: sorgu dizesindeki jeton
        // kabul edilse, adres tarayıcı geçmişine ve sunucu günlüklerine düşen
        // bir anahtar olurdu. Ön yüz bu yüzden blob'a geçti; uç da bu yüzden
        // sorguyu okumamalı.
        [$yonetici, $vr] = $this->belge();

        $jeton = $yonetici->createToken('deneme')->plainTextToken;

        $yanit = $this->get("/api/admin/verification-requests/{$vr->id}/document?token={$jeton}");

        $this->assertSame(
            401,
            $yanit->getStatusCode(),
            'sorgudaki jeton kimlik yerine geçiyor — adres bir anahtara dönüşür',
        );
    }

    public function test_yonetici_olmayan_belgeyi_goremiyor(): void
    {
        [, $vr] = $this->belge();

        $hekim = User::factory()->create(['role_id' => 'doctor']);

        $this->actingAs($hekim, 'sanctum')
            ->get("/api/admin/verification-requests/{$vr->id}/document")
            ->assertStatus(403);
    }
}
