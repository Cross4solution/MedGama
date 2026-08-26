<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\ClinicReview;
use App\Models\DoctorReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Yorum denetimi — çalışan yarısı ve olmayan yarısı.
 *
 * `admin/reviews/{id}/approve|hide|reject` uçları `DoctorReview` üzerinde
 * çalışıyor ve doğru çalışıyor: durum değişiyor, görünürlük değişiyor, karar
 * denetim günlüğüne yazılıyor. Bu ölçüt onu kaydediyor.
 *
 * Kaydettiği ikinci şey bir EKSİK: `ClinicReview` için denetim ucu YOK.
 * Yönetici ekranı "Hasta değerlendirmelerini onaylayın, reddedin veya
 * gizleyin" diyor ve yalnız hekim yorumlarını listeliyor. Ölçüldüğünde
 * veritabanında 93 hekim, 113 klinik yorumu vardı; ekran 93'ünü gösteriyordu.
 *
 * Klinik yorumları ayrıca `moderation_status = 'pending'` iken de herkese açık
 * listede görünüyor. İkisi birleşince: bir klinik yorumu yazıldığı an yayında
 * ve üründe onu kaldıracak hiçbir yol yok.
 *
 * Bu ölçüt eksiği DÜZELTMİYOR — yeni bir yetenek eklemek ürün kararı. Eksiğin
 * varlığını sabitliyor ki uç eklendiğinde bu test güncellensin, sessizce
 * unutulmasın.
 */
class YorumDenetimiTest extends TestCase
{
    use RefreshDatabase;

    private function yonetici(): self
    {
        $admin = User::factory()->create(['role_id' => 'superAdmin', 'is_active' => true]);
        $jeton = $admin->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function hekimYorumu(): DoctorReview
    {
        return DoctorReview::create([
            'doctor_id'         => User::factory()->doctor()->create(['is_verified' => true])->id,
            'patient_id'        => User::factory()->patient()->create()->id,
            'rating'            => 5,
            'comment'           => 'Ölçüm için yazılmış yorum.',
            'moderation_status' => 'pending',
            'is_visible'        => true,
        ]);
    }

    public function test_hekim_yorumu_onaylanabiliyor(): void
    {
        $yorum = $this->hekimYorumu();

        // Görünürlük KAPALI başlatılıyor: açık başlatılsaydı, onayın alanı
        // yazıp yazmadığı ölçülemezdi — ilk yazdığımda öyleydi ve `is_visible`
        // yazımını kaldıran mutasyona yeşil kaldı.
        $yorum->forceFill(['is_visible' => false])->save();

        $this->yonetici()->putJson("/api/admin/reviews/{$yorum->id}/approve")->assertOk();

        $taze = $yorum->fresh();

        $this->assertSame('approved', $taze->moderation_status);
        $this->assertTrue((bool) $taze->is_visible);
    }

    public function test_hekim_yorumu_gizlenebiliyor_ve_reddedilebiliyor(): void
    {
        foreach ([['hide', 'hidden'], ['reject', 'rejected']] as [$eylem, $beklenen]) {
            $yorum = $this->hekimYorumu();

            $this->yonetici()
                ->putJson("/api/admin/reviews/{$yorum->id}/{$eylem}", ['note' => 'ölçüm'])
                ->assertOk();

            $taze = $yorum->fresh();

            $this->assertSame($beklenen, $taze->moderation_status, "$eylem durumu yazmadı");
            $this->assertFalse((bool) $taze->is_visible, "$eylem yorumu gizlemedi");
        }
    }

    public function test_karar_denetime_yaziliyor(): void
    {
        $yorum = $this->hekimYorumu();

        $this->yonetici()->putJson("/api/admin/reviews/{$yorum->id}/approve")->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'action'      => 'review_approved',
            'resource_id' => $yorum->id,
        ]);
    }

    public function test_klinik_yorumlari_denetim_yuzeyinde_YOK(): void
    {
        // Bu ölçüt bir EKSİĞİ sabitliyor, bir davranışı değil.
        //
        // Klinik yorumu için denetim ucu yok ve yönetici listesi onu
        // içermiyor. Uç eklendiğinde bu test kırmızı yanacak — o an eksiğin
        // kapandığını gösterir ve testin güncellenmesi gerekir. Amaç, eksiğin
        // sessizce kalıcılaşmaması.
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id, 'is_active' => true]);

        $klinikYorumu = ClinicReview::create([
            'clinic_id'         => $klinik->id,
            'patient_id'        => User::factory()->patient()->create()->id,
            'rating'            => 1,
            'comment'           => 'Denetlenemeyen klinik yorumu.',
            'moderation_status' => 'pending',
            'is_visible'        => true,
        ]);

        // Yönetici listesi klinik yorumunu taşımıyor.
        $liste = $this->yonetici()->getJson('/api/admin/reviews?per_page=100')->assertOk()->getContent();

        $this->assertStringNotContainsString(
            $klinikYorumu->id,
            $liste,
            'klinik yorumu artık denetim listesinde — bu ölçüt güncellenmeli',
        );

        // Hekim yorumu uçları klinik yorumunu tanımıyor.
        $this->yonetici()
            ->putJson("/api/admin/reviews/{$klinikYorumu->id}/hide")
            ->assertStatus(404);
    }
}
