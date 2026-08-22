<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * İletişim mesajlarına kim erişebiliyor.
 *
 * inbox() rolüne göre düzgün süzülüyordu; show(), destroy() ve
 * downloadAttachment() ise HİÇBİR sahiplik kontrolü yapmıyordu. Kimliği bilen
 * herhangi bir oturumlu kullanıcı başka kliniğe gelen mesajı okuyabiliyor,
 * ekini indirebiliyor ve kalıcı olarak silebiliyordu.
 *
 * Listeyi süzmek erişim kontrolü değil — bu dosyanın asıl konusu o.
 * Silme ayrıca geri alınamıyor: yabancı bir kullanıcı kliniğin gelen kutusunu
 * boşaltabilirdi.
 */
class IletisimMesajiErisimTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: Clinic, 1: User} klinik, sahibi */
    private function klinikVeSahibi(): array
    {
        $klinik = Clinic::factory()->create();
        $sahip  = User::factory()->clinicOwner()->create(['clinic_id' => $klinik->id]);
        $klinik->update(['owner_id' => $sahip->id]);

        return [$klinik, $sahip];
    }

    private function mesaj(Clinic $klinik, User $gonderen, string $govde = 'Merhaba'): ContactMessage
    {
        return ContactMessage::create([
            'sender_id'     => $gonderen->id,
            'receiver_id'   => $klinik->id,
            'receiver_type' => 'clinic',
            'subject'       => 'Bilgi talebi',
            'body'          => $govde,
        ]);
    }

    public function test_alici_klinik_mesaji_okuyabiliyor(): void
    {
        [$klinik, $sahip] = $this->klinikVeSahibi();
        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta);

        $this->actingAs($sahip, 'sanctum')
            ->getJson("/api/contact-messages/{$mesaj->id}")
            ->assertOk();
    }

    public function test_gonderen_kendi_mesajini_okuyabiliyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta);

        $this->actingAs($hasta, 'sanctum')
            ->getJson("/api/contact-messages/{$mesaj->id}")
            ->assertOk();
    }

    public function test_ilgisiz_kullanici_mesaji_okuyamiyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta, 'GIZLI-ICERIK');

        $yabanci = User::factory()->patient()->create();

        $yanit = $this->actingAs($yabanci, 'sanctum')
            ->getJson("/api/contact-messages/{$mesaj->id}");

        $yanit->assertForbidden();
        $this->assertStringNotContainsString('GIZLI-ICERIK', $yanit->getContent());
    }

    public function test_baska_kliniginin_sahibi_mesaji_okuyamiyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        [, $digerSahip] = $this->klinikVeSahibi();

        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta);

        $this->actingAs($digerSahip, 'sanctum')
            ->getJson("/api/contact-messages/{$mesaj->id}")
            ->assertForbidden();
    }

    public function test_ilgisiz_kullanici_mesaji_silemiyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta);

        $yabanci = User::factory()->patient()->create();

        // Silme geri alınamıyor: yabancı biri kliniğin gelen kutusunu
        // boşaltabilseydi kayıp kalıcı olurdu.
        $this->actingAs($yabanci, 'sanctum')
            ->deleteJson("/api/contact-messages/{$mesaj->id}")
            ->assertForbidden();

        $this->assertNotNull(ContactMessage::find($mesaj->id), 'Mesaj yabancı biri tarafından silinmiş');
    }

    public function test_alici_klinik_mesaji_silebiliyor(): void
    {
        [$klinik, $sahip] = $this->klinikVeSahibi();
        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta);

        $this->actingAs($sahip, 'sanctum')
            ->deleteJson("/api/contact-messages/{$mesaj->id}")
            ->assertOk();

        $this->assertNull(ContactMessage::find($mesaj->id));
    }

    public function test_ilgisiz_kullanici_eki_indiremiyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta);

        $yabanci = User::factory()->patient()->create();

        // Ek gerçekten olmasa bile yetki kontrolü ÖNCE çalışmalı: 403 yerine
        // 404 dönmek, mesajın varlığını doğrulayan bir sızıntı olurdu.
        $this->actingAs($yabanci, 'sanctum')
            ->get("/api/contact-messages/{$mesaj->id}/download/00000000-0000-4000-8000-000000000000")
            ->assertForbidden();
    }

    public function test_oturumsuz_mesaj_okunamiyor(): void
    {
        [$klinik] = $this->klinikVeSahibi();
        $hasta = User::factory()->patient()->create();
        $mesaj = $this->mesaj($klinik, $hasta);

        $this->getJson("/api/contact-messages/{$mesaj->id}")->assertUnauthorized();
    }
}
