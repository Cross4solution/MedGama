<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use DatabaseTransactions;

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
        $this->slot    = CalendarSlot::factory()->create([
            'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
        ]);
    }

    public function test_patient_can_create_appointment(): void
    {
        $response = $this->actingAs($this->patient, 'sanctum')
            ->postJson('/api/appointments', [
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
        $this->actingAs($this->patient, 'sanctum')
            ->postJson('/api/appointments', [
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

    public function test_duplicate_slot_booking_is_rejected(): void
    {
        // First booking
        $this->actingAs($this->patient, 'sanctum')
            ->postJson('/api/appointments', [
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
        $response = $this->actingAs($patient2, 'sanctum')
            ->postJson('/api/appointments', [
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

    public function test_doctor_can_view_own_appointment(): void
    {
        $appointment = Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'clinic_id'  => $this->clinic->id,
            'slot_id'    => $this->slot->id,
        ]);

        $response = $this->actingAs($this->doctor, 'sanctum')
            ->getJson("/api/appointments/{$appointment->id}");

        $response->assertOk();
    }
}
