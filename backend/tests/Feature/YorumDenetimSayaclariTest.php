<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\ClinicReview;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Denetim sayaçları HANGİ sekmedeyse onu saymalı.
 *
 * Klinik yorumu denetimi doktor yorumunun birebir karşılığı olarak
 * eklenmişti — listeleme, onaylama, reddetme, gizleme uçlarının hepsi var.
 * Sayaç ucu eklenmemişti: `/admin/reviews/stats` her zaman DoctorReview
 * sayıyordu ve ekran aynı dört kartı iki sekmede de gösteriyordu.
 *
 * Sonuç sessiz: klinik sekmesinde onay bekleyen yorumlar varken sayaç
 * "Beklemede 0" diyor. Yönetici bekleyen iş olmadığını sanıp sekmeyi
 * açmıyor; denetimden geçmemiş yorum yayına girmeden bekliyor kalıyor
 * (ya da kötü niyetli bir yorum fark edilmiyor).
 */
class YorumDenetimSayaclariTest extends TestCase
{
    use RefreshDatabase;

    private function yoneticiOl(): void
    {
        Sanctum::actingAs(User::factory()->create(['role_id' => 'superAdmin']));
    }

    private function klinikYorumu(string $durum): void
    {
        $klinik = Clinic::factory()->create();

        $yorum = new ClinicReview();
        $yorum->id = (string) Str::uuid();
        $yorum->forceFill([
            'clinic_id'         => $klinik->id,
            'patient_id'        => User::factory()->create(['role_id' => 'patient'])->id,
            'rating'            => 5,
            'comment'           => 'deneme',
            'moderation_status' => $durum,
        ])->save();
    }

    public function test_klinik_sekmesi_klinik_yorumlarini_sayiyor(): void
    {
        $this->yoneticiOl();

        $this->klinikYorumu('pending');
        $this->klinikYorumu('pending');
        $this->klinikYorumu('approved');

        $this->getJson('/api/admin/reviews/stats?type=clinic')
            ->assertOk()
            ->assertJson(['pending' => 2, 'approved' => 1, 'rejected' => 0, 'hidden' => 0]);
    }

    public function test_klinik_yorumlari_doktor_sayaclarina_sizmiyor(): void
    {
        $this->yoneticiOl();

        $this->klinikYorumu('pending');

        // Doktor sekmesi (varsayılan) klinik yorumundan etkilenmemeli.
        $this->getJson('/api/admin/reviews/stats')
            ->assertOk()
            ->assertJson(['pending' => 0]);
    }

    public function test_bilinmeyen_tur_doktora_dusuyor(): void
    {
        $this->yoneticiOl();

        $this->klinikYorumu('pending');

        $this->getJson('/api/admin/reviews/stats?type=uydurma')
            ->assertOk()
            ->assertJson(['pending' => 0]);
    }
}
