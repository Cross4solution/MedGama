<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Yönetici okumaları — kimlik belgesi ve istatistikler.
 *
 * `admin/verification-requests/{id}/document` bir hekimin diploma ya da lisans
 * belgesini sunuyor. Özel diskten okuyor ve rota yönetici süzgeci taşıyor —
 * ikisi de doğru. Eksik olan İZDİ: kimin hangi belgeye baktığı hiçbir yere
 * yazılmıyordu.
 *
 * Klinik tarafındaki eşdeğeri bunu zaten yapıyor
 * (`ClinicVerificationController::downloadDocument` →
 * `verification_document_viewed`). Aynı hassasiyetteki iki belgeden biri iz
 * bırakıyor, diğeri bırakmıyordu; hekim tarafı hizalandı.
 *
 * İstatistik uçları da burada kapsanıyor: sayı döndüren bir uç sessizce
 * kapsamını kaybederse kimse fark etmez — dönen tek şey daha büyük bir sayıdır.
 */
class YoneticiOkumalariTest extends TestCase
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

    private function basvuru(): VerificationRequest
    {
        Storage::fake('local');
        Storage::disk('local')->put('verification-documents/diploma.pdf', 'sahte-belge');

        return VerificationRequest::create([
            'doctor_id'      => User::factory()->doctor()->create()->id,
            'document_type'  => 'diploma',
            'document_label' => 'Diploma',
            'file_path'      => 'verification-documents/diploma.pdf',
            'file_name'      => 'diploma.pdf',
            'mime_type'      => 'application/pdf',
            'status'         => 'pending',
        ]);
    }

    public function test_kimlik_belgesi_goruntulemesi_kayda_geciyor(): void
    {
        $vr = $this->basvuru();

        $this->olarak($this->yoneticiKullanici)
            ->get("/api/admin/verification-requests/{$vr->id}/document")
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'action'        => 'verification_document_viewed',
            'resource_type' => 'verification_request',
            'resource_id'   => $vr->id,
        ]);
    }

    public function test_yonetici_olmayan_belgeye_ulasamiyor(): void
    {
        $vr = $this->basvuru();

        foreach ([
            User::factory()->patient()->create(),
            User::factory()->doctor()->create(['is_verified' => true]),
            User::factory()->clinicOwner()->create(),
        ] as $yabanci) {
            $this->olarak($yabanci)
                ->get("/api/admin/verification-requests/{$vr->id}/document")
                ->assertStatus(403);
        }

        // Reddedilen istekler iz de bırakmamalı: görüntüleme olmadı.
        $this->assertDatabaseMissing('audit_logs', [
            'action'      => 'verification_document_viewed',
            'resource_id' => $vr->id,
        ]);
    }

    public function test_istatistik_uclari_yonetici_disina_kapali(): void
    {
        $hasta = User::factory()->patient()->create();

        foreach ([
            '/api/admin/users/stats',
            '/api/admin/reviews/stats',
            '/api/admin/audit-logs/stats',
            '/api/admin/verification-requests/stats',
        ] as $uc) {
            $this->olarak($hasta)->getJson($uc)->assertStatus(403);
        }
    }

    public function test_istatistik_uclari_yoneticiye_calisiyor(): void
    {
        // Aşırı kilitleyip ucu boşaltmadığımızın kanıtı.
        foreach ([
            '/api/admin/users/stats',
            '/api/admin/reviews/stats',
            '/api/admin/verification-requests/stats',
        ] as $uc) {
            $this->olarak($this->yoneticiKullanici)->getJson($uc)->assertOk();
        }
    }
}
