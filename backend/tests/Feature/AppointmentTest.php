<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private User $doctor;
    private User $patient;
    private Clinic $clinic;
    private CalendarSlot $slot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic  = Clinic::factory()->create();
        $this->doctor  = User::factory()->doctor()->create(['clinic_id' => $this->clinic->id]);
        $this->patient = User::factory()->patient()->create();

        // Görüntülü görüşme doktorun tercihidir ve kapalıysa online randevu
        // reddedilir. Bu testler randevu akışını ölçüyor, o kuralı değil —
        // bu yüzden doktorun tercihi açık olmalı.
        \App\Models\DoctorProfile::updateOrCreate(
            ['user_id' => $this->doctor->id],
            ['online_consultation' => true]
        );

        $this->slot    = CalendarSlot::factory()->create([
            'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
        ]);
    }

    public function test_patient_can_create_appointment(): void
    {
        Sanctum::actingAs($this->patient);
        $response = $this->postJson('/api/appointments', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'online',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date->toDateString(),
            'appointment_time' => '10:00',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
        ]);
    }

    public function test_slot_becomes_unavailable_after_booking(): void
    {
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/appointments', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'online',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date->toDateString(),
            'appointment_time' => '10:00',
        ]);

        $this->slot->refresh();
        $this->assertFalse($this->slot->is_available);
    }

    /**
     * Randevu saati mutlak bir ana bağlanmalı. Duvar saati ("10:00") tek başına
     * hangi ülkenin saati olduğunu söylemiyordu; sunucu UTC olduğu için tüm
     * zaman kuralları (red penceresi, hatırlatmalar) kaymış çalışıyordu.
     */
    public function test_appointment_stores_absolute_instant_with_timezone(): void
    {
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/appointments', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'online',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date->toDateString(),
            'appointment_time' => '10:00',
        ])->assertStatus(201);

        $randevu = Appointment::latest('created_at')->first();

        $this->assertNotNull($randevu->starts_at, 'Mutlak an kaydedilmedi');
        $this->assertNotEmpty($randevu->timezone, 'Saat dilimi kaydedilmedi');

        // Europe/Istanbul (+03) yerel 10:00 → 07:00 UTC
        $beklenen = \Illuminate\Support\Carbon::createFromFormat(
            'Y-m-d H:i',
            $this->slot->slot_date->toDateString() . ' 10:00',
            $randevu->timezone
        )->utc();

        $this->assertSame($beklenen->toDateTimeString(), $randevu->starts_at->utc()->toDateTimeString());
    }

    /** Doktorun kendi açtığı saatten alınan randevu doğrudan onaylı başlar. */
    public function test_slot_booking_is_confirmed_immediately(): void
    {
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/appointments', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'online',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date->toDateString(),
            'appointment_time' => '10:00',
        ])->assertStatus(201)->assertJsonPath('data.status', 'confirmed');
    }

    /**
     * Doktorun tek aracı reddetmek; bunun son tarihi var, yoksa hasta görüşmeye
     * dakikalar kala boşa düşebilir.
     */
    public function test_doctor_cannot_reject_within_two_hours(): void
    {
        $yakin = Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'status'     => 'confirmed',
            'starts_at'  => now()->addMinutes(90),
            'timezone'   => 'Europe/Istanbul',
        ]);

        Sanctum::actingAs($this->doctor);
        $this->putJson("/api/appointments/{$yakin->id}/cancel")
            ->assertStatus(422)
            ->assertJsonPath('code', 'REJECT_WINDOW_CLOSED');

        $this->assertSame('confirmed', $yakin->fresh()->status);
    }

    public function test_doctor_can_reject_outside_the_window(): void
    {
        $uzak = Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'status'     => 'confirmed',
            'starts_at'  => now()->addHours(5),
            'timezone'   => 'Europe/Istanbul',
        ]);

        Sanctum::actingAs($this->doctor);
        $this->putJson("/api/appointments/{$uzak->id}/cancel")->assertOk();

        $this->assertSame('cancelled', $uzak->fresh()->status);
    }

    public function test_duplicate_slot_booking_is_rejected(): void
    {
        // First booking
        Sanctum::actingAs($this->patient);
        $this->postJson('/api/appointments', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'online',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date->toDateString(),
            'appointment_time' => '10:00',
        ]);

        $patient2 = User::factory()->patient()->create();

        // Second booking on same slot
        Sanctum::actingAs($patient2);
        $response = $this->postJson('/api/appointments', [
            'patient_id'       => $patient2->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'online',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date->toDateString(),
            'appointment_time' => '10:00',
        ]);

        $response->assertStatus(422);
    }

    /**
     * CRM takvimi randevuyu doğru kutuya koyabilmek için mutlak ana ihtiyaç
     * duyuyor. Saat dilimsiz "2026-08-20T10:00" gönderilirse takvim onu
     * tarayıcının yerel saati sanıyor ve yurt dışındaki doktorun ekranında
     * randevu yanlış saatte görünüyor.
     */
    public function test_takvim_olaylari_mutlak_an_ve_ret_hakki_tasir(): void
    {
        $randevu = Appointment::factory()->create([
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'status'           => 'confirmed',
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => '10:00',
            'starts_at'        => now()->addHours(26),
            'timezone'         => 'Europe/Istanbul',
        ]);

        Sanctum::actingAs($this->doctor);
        $olay = collect($this->getJson('/api/appointments/calendar-events')->assertOk()->json('events'))
            ->firstWhere('id', $randevu->id);

        $this->assertNotNull($olay, 'Randevu takvim olaylarında yok');

        // Saat dilimi eki olmadan gönderilirse takvim yanlış yere koyar.
        $this->assertMatchesRegularExpression(
            '/(Z|[+-]\d{2}:\d{2})$/',
            $olay['start'],
            'Takvim olayı saat dilimsiz gönderilmiş',
        );
        $this->assertSame(
            $randevu->starts_at->utc()->toDateTimeString(),
            \Illuminate\Support\Carbon::parse($olay['start'])->utc()->toDateTimeString(),
        );

        // Ret hakkını CRM yeniden hesaplamasın diye sunucudan geliyor.
        $this->assertTrue($olay['extendedProps']['doctor_can_reject']);
        $this->assertSame('Europe/Istanbul', $olay['extendedProps']['timezone']);
    }

    public function test_doctor_can_view_own_appointment(): void
    {
        $appointment = Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'clinic_id'  => $this->clinic->id,
            'slot_id'    => $this->slot->id,
        ]);

        Sanctum::actingAs($this->doctor);
        $response = $this->getJson("/api/appointments/{$appointment->id}");

        $response->assertOk();
    }
}
