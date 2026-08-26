<?php

namespace Tests\Feature;

use App\Models\MedStreamPost;
use App\Models\MedStreamReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * İçerik şikayeti kararları — reddet ve kaldır.
 *
 * MedStream herkese açık bir akış ve şikayet mekanizması, uygunsuz içeriğin
 * tek çıkış yolu. İki karar var ve ikisi de kapsanmamıştı; tohumda şikayet
 * kaydı da yok, dolayısıyla elle denenemiyordu.
 *
 * Kritik olan şu: "kaldır" kararı YALNIZ şikayeti işaretlemekle kalmamalı,
 * GÖNDERİYİ de gizlemeli. Şikayeti "işlendi" yapıp içeriği yayında bırakmak,
 * yöneticiye işini yaptığını söylerken içeriği görünür tutmak olurdu — bu
 * çalışmada birkaç kez rastlanan biçim.
 */
class IcerikSikayetiTest extends TestCase
{
    use RefreshDatabase;

    private function yonetici(): self
    {
        $admin = User::factory()->create(['role_id' => 'superAdmin', 'is_active' => true]);
        $jeton = $admin->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** @return array{0: MedStreamPost, 1: MedStreamReport} */
    private function sikayet(): array
    {
        $yazar = User::factory()->doctor()->create(['is_verified' => true]);

        $gonderi = MedStreamPost::create([
            'author_id' => $yazar->id,
            'post_type' => 'text',
            'content'   => 'Şikayet ölçümü için gönderi.',
            'is_active' => true,
        ]);

        $sikayet = MedStreamReport::create([
            'post_id'      => $gonderi->id,
            'reporter_id'  => User::factory()->patient()->create()->id,
            'reason'       => 'spam',
            'admin_status' => 'pending',
        ]);

        return [$gonderi, $sikayet];
    }

    public function test_sikayeti_reddetmek_gonderiyi_gizlemiyor(): void
    {
        [$gonderi, $sikayet] = $this->sikayet();

        $this->yonetici()
            ->putJson("/api/admin/reports/{$sikayet->id}/approve")
            ->assertOk();

        $this->assertSame('reviewed', $sikayet->fresh()->admin_status);
        $this->assertFalse(
            (bool) $gonderi->fresh()->is_hidden,
            'şikayet reddedildi ama gönderi gizlendi: karar tersine işlemiş',
        );
    }

    public function test_kaldirma_karari_gonderiyi_gercekten_gizliyor(): void
    {
        [$gonderi, $sikayet] = $this->sikayet();

        $this->yonetici()
            ->deleteJson("/api/admin/reports/{$sikayet->id}/remove")
            ->assertOk();

        $this->assertSame('hidden', $sikayet->fresh()->admin_status);
        $this->assertTrue(
            (bool) $gonderi->fresh()->is_hidden,
            'şikayet "işlendi" işaretlendi ama içerik hâlâ yayında',
        );
    }

    public function test_gizlenen_gonderi_herkese_acik_akista_gorunmuyor(): void
    {
        // Asıl ölçüm bu: veritabanındaki bayrak değil, içeriğin GÖRÜNMEMESİ.
        [$gonderi, $sikayet] = $this->sikayet();

        $this->yonetici()->deleteJson("/api/admin/reports/{$sikayet->id}/remove")->assertOk();

        app('auth')->forgetGuards();

        $akis = $this->getJson('/api/medstream/posts?per_page=100')->assertOk()->getContent();

        $this->assertStringNotContainsString(
            $gonderi->id,
            $akis,
            'kaldırılan gönderi herkese açık akışta duruyor',
        );
    }

    public function test_yonetici_olmayan_karar_veremiyor(): void
    {
        [, $sikayet] = $this->sikayet();

        $yabanci = User::factory()->doctor()->create(['is_verified' => true]);
        $jeton = $yabanci->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->deleteJson("/api/admin/reports/{$sikayet->id}/remove")
            ->assertStatus(403);

        $this->assertSame('pending', $sikayet->fresh()->admin_status);
    }
}
