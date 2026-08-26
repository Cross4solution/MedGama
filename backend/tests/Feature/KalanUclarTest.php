<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\DoctorFollow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kapsamda kalan son uçlar — başvuru verisi ve küçük durum sorguları.
 *
 * Bunların hiçbiri kusurlu çıkmadı; ölçüt kusur bildirmiyor, ikisi arasındaki
 * AYRIMI sabitliyor:
 *
 *   herkese açık olması GEREKENLER  — uzmanlık, şehir, hastalık listeleri,
 *                                     hastane ve klinik profilleri, SSS.
 *                                     Arama arayüzünün beslendiği veri.
 *   kişiye bağlı olanlar            — kliniğin doğrulama durumu, kimin kimi
 *                                     takip ettiği.
 *
 * İkinci grubun kapsamı kaybolursa uç yine 200 döner; değişen tek şey KİMİN
 * verisinin döndüğüdür. Bu çalışmada aynı biçim iki kez sızıntı oldu
 * (66d1aa4, 2edc25d).
 */
class KalanUclarTest extends TestCase
{
    use RefreshDatabase;

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** @return array{0: User, 1: Clinic} */
    private function klinikKur(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id, 'is_active' => true]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        return [$sahip, $klinik];
    }

    public function test_dogrulama_durumu_kendi_kliniginden_geliyor(): void
    {
        [$sahip, $klinik] = $this->klinikKur();
        $klinik->forceFill(['verification_status' => 'approved', 'is_verified' => true])->save();

        [$digerSahip, $digerKlinik] = $this->klinikKur();
        $digerKlinik->forceFill(['verification_status' => 'rejected', 'is_verified' => false])->save();

        $this->olarak($sahip)
            ->getJson('/api/clinic-verification/status')
            ->assertOk()
            ->assertJsonPath('verification_status', 'approved');

        // Komşu kliniğin durumu değil, kendi durumu.
        $this->olarak($digerSahip)
            ->getJson('/api/clinic-verification/status')
            ->assertOk()
            ->assertJsonPath('verification_status', 'rejected');
    }

    public function test_kliniksiz_kullanici_dogrulama_durumu_goremiyor(): void
    {
        $this->olarak(User::factory()->patient()->create())
            ->getJson('/api/clinic-verification/status')
            ->assertStatus(404);
    }

    public function test_takip_durumu_cagirana_ozel(): void
    {
        $hekim = User::factory()->doctor()->create(['is_active' => true, 'is_verified' => true]);
        $takipci = User::factory()->patient()->create();
        $baskasi = User::factory()->patient()->create();

        DoctorFollow::create([
            'follower_id'    => $takipci->id,
            'following_id'   => $hekim->id,
            'following_type' => 'doctor',
            'is_active'      => true,
        ]);

        $sorgu = ['target_type' => 'doctor', 'target_id' => $hekim->id];

        $this->olarak($takipci)
            ->getJson('/api/social/is-following?' . http_build_query($sorgu))
            ->assertOk()
            ->assertJsonPath('following', true);

        // Başkasının takibi bu kullanıcıyı takipçi yapmamalı.
        $this->olarak($baskasi)
            ->getJson('/api/social/is-following?' . http_build_query($sorgu))
            ->assertOk()
            ->assertJsonPath('following', false);
    }

    public function test_takipci_sayisi_yalnizca_sayi_veriyor(): void
    {
        // Uç oturum istiyor (401) — herkese açık değil. Ölçülen şey sayının
        // dönmesi ama KİMİN takip ettiğinin dönmemesi.
        $hekim = User::factory()->doctor()->create(['is_active' => true, 'is_verified' => true]);
        $takipci = User::factory()->patient()->create(['fullname' => 'Gizli Takipci']);

        DoctorFollow::create([
            'follower_id'    => $takipci->id,
            'following_id'   => $hekim->id,
            'following_type' => 'doctor',
            'is_active'      => true,
        ]);

        $yanit = $this->olarak(User::factory()->patient()->create())
            ->getJson('/api/social/followers?' . http_build_query([
                'target_type' => 'doctor',
                'target_id'   => $hekim->id,
            ]))
            ->assertOk();

        $this->assertSame(1, $yanit->json('count'));
        $this->assertStringNotContainsString(
            'Gizli Takipci',
            $yanit->getContent(),
            'takipçi sayısı ucu kimlerin takip ettiğini de veriyor',
        );
    }

    public function test_basvuru_verisi_herkese_acik(): void
    {
        // Arama arayüzü bunlarla besleniyor; oturum istemeleri aramayı bozardı.
        foreach ([
            '/api/catalog/specialties',
            '/api/catalog/cities',
            '/api/catalog/diseases',
            '/api/catalog/popular',
        ] as $uc) {
            $this->getJson($uc)->assertOk();
        }
    }

    public function test_hastane_ve_klinik_profilleri_herkese_acik(): void
    {
        [, $klinik] = $this->klinikKur();
        $hekim = User::factory()->doctor()->create(['is_active' => true, 'is_verified' => true]);

        $this->getJson("/api/clinics/{$klinik->id}/review-stats")->assertOk();
        $this->getJson("/api/doctors/{$hekim->id}/faqs")->assertOk();
        $this->getJson('/api/hospitals/stats')->assertStatus(401);
    }
}
