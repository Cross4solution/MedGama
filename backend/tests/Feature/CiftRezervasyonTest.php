<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Aynı doktorun aynı saati iki kez verilemez.
 *
 * Canlıya karşı yapılan eşzamanlılık denemesinde 5 istekten 5'i birden kabul
 * edilmişti: hiçbir çakışma kontrolü yoktu ve slotsuz randevuda kilit de
 * çalışmıyordu. Doktor o saatte beş hastayı bekliyor olurdu.
 *
 * Koruma veritabanındaki benzersiz dizinde: önce okuyup sonra yazan bir
 * kontrol, iki isteğin arasındaki milisaniyeyi kapatamaz.
 */
class CiftRezervasyonTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;
    private Clinic $klinik;

    protected function setUp(): void
    {
        parent::setUp();
        $this->klinik = Clinic::factory()->create();
        $this->doktor = User::factory()->doctor()->create(['clinic_id' => $this->klinik->id]);
    }

    private function randevuVer(User $hasta, string $tarih, string $saat): Appointment
    {
        return app(\App\Services\AppointmentService::class)->store($hasta, [
            'patient_id'       => $hasta->id,
            'doctor_id'        => $this->doktor->id,
            'clinic_id'        => $this->klinik->id,
            'appointment_type' => 'online',
            'appointment_date' => $tarih,
            'appointment_time' => $saat,
        ], false);
    }

    public function test_ayni_saat_ikinci_kez_verilemiyor(): void
    {
        $birinci = User::factory()->patient()->create();
        $ikinci  = User::factory()->patient()->create();

        $this->randevuVer($birinci, '2030-01-15', '14:00');

        $this->expectException(ValidationException::class);
        $this->randevuVer($ikinci, '2030-01-15', '14:00');
    }

    public function test_farkli_saat_ve_farkli_doktor_engellenmiyor(): void
    {
        $hasta = User::factory()->patient()->create();
        $baskaDoktor = User::factory()->doctor()->create(['clinic_id' => $this->klinik->id]);

        $this->randevuVer($hasta, '2030-01-15', '14:00');

        // Aynı doktor, farklı saat.
        $this->randevuVer($hasta, '2030-01-15', '15:00');

        // Farklı doktor, aynı saat — kilit doktora özel olmalı, saate değil.
        $eskiDoktor = $this->doktor;
        $this->doktor = $baskaDoktor;
        $this->randevuVer($hasta, '2030-01-15', '14:00');
        $this->doktor = $eskiDoktor;

        $this->assertSame(3, Appointment::count());
    }

    public function test_iptal_edilen_saat_yeniden_verilebiliyor(): void
    {
        $birinci = User::factory()->patient()->create();
        $ikinci  = User::factory()->patient()->create();

        $randevu = $this->randevuVer($birinci, '2030-01-15', '14:00');
        $this->assertNotNull($randevu->fresh()->cakisma_anahtari);

        $randevu->update(['status' => 'cancelled']);

        // İptalden sonra anahtar boşalmalı, yoksa o saat sonsuza dek kilitli
        // kalır ve doktor iptal edilen bir randevunun yerine kimseyi alamaz.
        $this->assertNull($randevu->fresh()->cakisma_anahtari);

        $yeni = $this->randevuVer($ikinci, '2030-01-15', '14:00');
        $this->assertSame('2030-01-15', $yeni->appointment_date->format('Y-m-d'));
    }

    public function test_anahtar_istekle_gonderilerek_atlatilamiyor(): void
    {
        $birinci = User::factory()->patient()->create();
        $ikinci  = User::factory()->patient()->create();

        $this->randevuVer($birinci, '2030-01-15', '14:00');

        // Saldırgan kendi anahtarını uydurup kilidi atlatmaya çalışırsa:
        // alan toplu atamaya kapalı olduğu için model yine doğrusunu üretmeli.
        $this->expectException(ValidationException::class);

        app(\App\Services\AppointmentService::class)->store($ikinci, [
            'patient_id'       => $ikinci->id,
            'doctor_id'        => $this->doktor->id,
            'clinic_id'        => $this->klinik->id,
            'appointment_type' => 'online',
            'appointment_date' => '2030-01-15',
            'appointment_time' => '14:00',
            'cakisma_anahtari' => 'uydurma-anahtar',
        ], false);
    }
}
