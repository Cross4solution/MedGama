<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Duyuruların kime göründüğü.
 *
 * Duyurular platform genelinde herkese basılıyor ve içerikleri her zaman
 * masum olmuyor: bakım penceresi, iç uyarı, yalnızca kliniklere yönelik
 * fiyat değişikliği gibi metinler yanlış role görünürse doğrudan bilgi
 * sızıntısı olur.
 *
 * Görünürlük üç koşula bağlı ve üçü de sessiz: hedef rol, yayın penceresi
 * (starts_at/ends_at) ve aktiflik. Biri gevşerse ekranda fazladan duyuru
 * çıkar, hiçbir yerde hata görünmez.
 *
 * Not — kodda gördüğüm kırılgan nokta: rol boş geldiğinde `forRole` hiç
 * süzmüyor, yani tüm duyuruları döndürüyor. Şu an uç oturum istediği için
 * ulaşılamıyor; uç bir gün misafire açılırsa hedefli duyurular sızar.
 * Aşağıdaki test bu davranışı görünür kılıyor.
 */
class DuyuruGorunurlukTest extends TestCase
{
    use RefreshDatabase;

    private ?User $yonetici = null;

    /** Duyuruyu kimin oluşturduğu zorunlu alan; her testte tek yönetici yeter. */
    private function duyuru(array $ek = []): Announcement
    {
        $this->yonetici ??= User::factory()->admin()->create();

        return Announcement::create(array_merge([
            'created_by'   => $this->yonetici->id,
            'title'        => 'Başlık',
            'body'         => 'İçerik',
            'type'         => 'info',
            'target_roles' => [],
            'is_active'    => true,
            'priority'     => 1,
        ], $ek));
    }

    public function test_hedefsiz_duyuru_herkese_gorunuyor(): void
    {
        $this->duyuru(['title' => 'HERKESE-ACIK']);
        $hasta = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/announcements')
            ->assertOk()
            ->assertSee('HERKESE-ACIK');
    }

    public function test_baska_role_hedefli_duyuru_gorunmuyor(): void
    {
        $this->duyuru(['title' => 'SADECE-KLINIKLERE', 'target_roles' => ['clinicOwner']]);
        $hasta = User::factory()->patient()->create();

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/announcements')
            ->assertOk();

        $this->assertStringNotContainsString(
            'SADECE-KLINIKLERE',
            $yanit->getContent(),
            'Hasta yalnızca kliniklere yönelik duyuruyu görüyor',
        );
    }

    public function test_hedeflenen_rol_duyuruyu_goruyor(): void
    {
        $this->duyuru(['title' => 'KLINIK-DUYURUSU', 'target_roles' => ['clinicOwner']]);
        $sahip = User::factory()->clinicOwner()->create();

        $this->actingAs($sahip, 'sanctum')
            ->getJson('/api/announcements')
            ->assertOk()
            ->assertSee('KLINIK-DUYURUSU');
    }

    public function test_pasif_duyuru_gorunmuyor(): void
    {
        $this->duyuru(['title' => 'PASIF-DUYURU', 'is_active' => false]);
        $hasta = User::factory()->patient()->create();

        $yanit = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/announcements')
            ->assertOk();

        $this->assertStringNotContainsString('PASIF-DUYURU', $yanit->getContent());
    }

    public function test_yayin_penceresi_disindaki_duyuru_gorunmuyor(): void
    {
        $this->duyuru(['title' => 'GELECEKTE', 'starts_at' => now()->addWeek()]);
        $this->duyuru(['title' => 'SURESI-GECMIS', 'ends_at' => now()->subDay()]);
        $this->duyuru(['title' => 'SUANKI']);

        $hasta = User::factory()->patient()->create();
        $govde = $this->actingAs($hasta, 'sanctum')
            ->getJson('/api/announcements')
            ->assertOk()
            ->getContent();

        // Zamanlanmış bir duyurunun erken görünmesi, henüz açıklanmamış bir
        // kararı duyurmak demek.
        $this->assertStringNotContainsString('GELECEKTE', $govde, 'Zamanlanmış duyuru erken göründü');
        $this->assertStringNotContainsString('SURESI-GECMIS', $govde);
        $this->assertStringContainsString('SUANKI', $govde);
    }

    public function test_oturumsuz_duyuru_listesi_kapali(): void
    {
        $this->duyuru(['title' => 'ICERIDEKI-DUYURU', 'target_roles' => ['superAdmin']]);

        // Uç oturum istiyor. İstemeseydi rol boş kalacak ve `forRole` hiç
        // süzmeyecekti — yönetici duyurusu misafire görünürdü.
        $this->getJson('/api/announcements')->assertUnauthorized();
    }
}
