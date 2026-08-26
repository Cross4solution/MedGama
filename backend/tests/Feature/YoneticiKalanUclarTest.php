<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Yönetici yüzeyinde kapsanmamış kalan uçlar.
 *
 * En dikkat çekeni veri ihlali bildirimiydi. Etkilenen kullanıcılar
 * `affected_user_ids.*` => `integer` ile doğrulanıyordu, ama bu sistemde
 * kullanıcı kimlikleri UUID: gerçek bir kimlik gönderildiğinde uç 422
 * veriyordu.
 *
 * Yani ihlal bildirimi, tam da bildirmesi gereken şeyi — KİMLERİN
 * etkilendiğini — kabul edemiyordu. KVKK Md. 12 ve GDPR Md. 33/34'ün
 * istediği şey bu. Özet ve önem derecesi geçiyordu, dolayısıyla uç
 * çalışıyor görünüyordu; yalnız listeyi verdiğinizde reddediyordu.
 */
class YoneticiKalanUclarTest extends TestCase
{
    use RefreshDatabase;

    private User $yoneticiKullanici;

    protected function setUp(): void
    {
        parent::setUp();

        $this->yoneticiKullanici = User::factory()->create([
            'role_id'   => 'superAdmin',
            'is_active' => true,
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_ihlal_bildirimi_etkilenen_kullanicilari_kabul_ediyor(): void
    {
        $etkilenen = User::factory()->patient()->create();

        $yanit = $this->olarak($this->yoneticiKullanici)
            ->postJson('/api/admin/security/breach-report', [
                'summary'           => 'Ölçüm için bildirim.',
                'severity'          => 'high',
                'affected_user_ids' => [$etkilenen->id],
            ])
            ->assertStatus(201);

        $this->assertSame(
            [$etkilenen->id],
            $yanit->json('incident.affected_user_ids'),
            'ihlal bildirimi etkilenen kullanıcıyı taşımıyor',
        );
    }

    public function test_ihlal_bildirimi_var_olmayan_kullaniciyi_reddediyor(): void
    {
        // Aşırı gevşetip her şeyi kabul etmediğimizin kanıtı: bildirim
        // listesinin doğru olması, listeyi alabilmek kadar önemli.
        $this->olarak($this->yoneticiKullanici)
            ->postJson('/api/admin/security/breach-report', [
                'summary'           => 'Ölçüm.',
                'affected_user_ids' => ['olmayan-kimlik'],
            ])
            ->assertStatus(422);
    }

    public function test_ihlal_bildirimi_yonetici_disina_kapali(): void
    {
        $this->olarak(User::factory()->doctor()->create(['is_verified' => true]))
            ->postJson('/api/admin/security/breach-report', ['summary' => 'deneme'])
            ->assertStatus(403);
    }

    public function test_kullanici_aramasi_calisiyor_ve_yonetici_disina_kapali(): void
    {
        User::factory()->patient()->create(['fullname' => 'Aranan Kisi']);

        $sonuc = $this->olarak($this->yoneticiKullanici)
            ->getJson('/api/admin/users/search?q=Aranan')
            ->assertOk()
            ->json();

        $this->assertNotEmpty($sonuc, 'yönetici kullanıcı aramasında sonuç yok');

        $this->olarak(User::factory()->patient()->create())
            ->getJson('/api/admin/users/search?q=Aranan')
            ->assertStatus(403);
    }

    public function test_bilgi_isteme_karari_basvuruyu_bekletiyor(): void
    {
        $hekim = User::factory()->doctor()->create(['is_verified' => false]);

        $vr = VerificationRequest::create([
            'doctor_id'      => $hekim->id,
            'document_type'  => 'diploma',
            'document_label' => 'Diploma',
            'file_path'      => 'verification-documents/olcum.pdf',
            'file_name'      => 'olcum.pdf',
            'mime_type'      => 'application/pdf',
            'status'         => 'pending',
        ]);

        $this->olarak($this->yoneticiKullanici)
            ->putJson("/api/admin/verification-requests/{$vr->id}/request-info", [
                'message' => 'Belgeniz okunaksız, tekrar yükleyin.',
            ])
            ->assertOk();

        // Bilgi istemek onay DEĞİL: hekim doğrulanmamış kalmalı.
        $this->assertFalse(
            (bool) $hekim->fresh()->is_verified,
            'bilgi istendi ama hekim doğrulanmış sayıldı',
        );
    }

    public function test_hekimin_basvuru_gecmisi_yoneticiye_aciliyor(): void
    {
        $hekim = User::factory()->doctor()->create();

        $this->olarak($this->yoneticiKullanici)
            ->getJson("/api/admin/verification-requests/doctor/{$hekim->id}")
            ->assertOk();

        $this->olarak(User::factory()->patient()->create())
            ->getJson("/api/admin/verification-requests/doctor/{$hekim->id}")
            ->assertStatus(403);
    }
}
