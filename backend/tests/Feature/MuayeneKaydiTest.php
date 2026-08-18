<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ExaminationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Muayene kaydı.
 *
 * Tablo başta yalnızca yüklenen belgeler içindi ve `file_url` zorunluydu.
 * Muayene sonradan aynı tabloya eklenince dosyasız her kayıt NOT NULL kısıtına
 * takılıyordu: doktor muayene açmayı denediğinde 500 alıyordu, yani özellik
 * hiç çalışmıyordu. Tanı notu da doğrulanıp sütuna yazılmıyordu.
 */
class MuayeneKaydiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dosyasiz_muayene_kaydi_acilir(): void
    {
        $doktor = User::factory()->doctor()->create();
        $hasta  = User::factory()->create(['role_id' => 'patient']);

        $kayit = app(ExaminationService::class)->createExamination($doktor, [
            'patient_id' => $hasta->id,
            'vitals'     => ['systolic' => 120, 'diastolic' => 80, 'pulse' => 72],
        ]);

        $this->assertNotNull($kayit->id);
        $this->assertSame('examination', $kayit->record_type);
        $this->assertNull($kayit->file_url);
    }

    public function test_tani_notu_ilk_kayitta_saklanir(): void
    {
        $doktor = User::factory()->doctor()->create();
        $hasta  = User::factory()->create(['role_id' => 'patient']);

        $kayit = app(ExaminationService::class)->createExamination($doktor, [
            'patient_id'     => $hasta->id,
            'diagnosis_note' => 'Hipertansiyon takibi',
        ]);

        $this->assertSame('Hipertansiyon takibi', $kayit->fresh()->diagnosis_note);
    }
}
