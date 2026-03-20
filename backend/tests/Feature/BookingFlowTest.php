<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Critical Path #2 — Booking Flow
 *
 * Flow: Patient books appointment → Doctor confirms → Status verified
 */
class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $doctor;
    private User $patient;
    private CalendarSlot $slot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->doctor  = User::factory()->doctor()->create();
        $this->patient = User::factory()->patient()->create();

        $this->slot = CalendarSlot::factory()->create([
            'doctor_id'    => $this->doctor->id,
            'slot_date'    => now()->addDays(3)->toDateString(),
            'start_time'   => '10:00',
            'is_available' => true,
        ]);
    }

    // ── Patient Books Appointment ──

    public function test_patient_can_book_appointment(): void
    {
        Sanctum::actingAs($this->patient);

        $response = $this->postJson('/api/appointments', [
            'doctor_id'        => $this->doctor->id,
            'patient_id'       => $this->patient->id,
            'appointment_type' => 'inPerson',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date,
            'appointment_time' => $this->slot->start_time,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        // Slot should be locked
        $this->slot->refresh();
        $this->assertFalse($this->slot->is_available);
    }

    public function test_appointment_model_uses_logs_activity_trait(): void
    {
        // Verify Appointment model is wired to audit logging
        $this->assertTrue(
            in_array(\App\Models\Traits\LogsActivity::class, class_uses_recursive(Appointment::class)),
            'Appointment model must use LogsActivity trait for audit logging'
        );
    }

    // ── Doctor Confirms Appointment ──

    public function test_doctor_can_confirm_appointment(): void
    {
        $appointment = Appointment::factory()->create([
            'doctor_id'  => $this->doctor->id,
            'patient_id' => $this->patient->id,
            'slot_id'    => $this->slot->id,
            'status'     => 'pending',
            'created_by' => $this->patient->id,
        ]);

        Sanctum::actingAs($this->doctor);

        $response = $this->putJson("/api/appointments/{$appointment->id}", [
            'status' => 'confirmed',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('appointments', [
            'id'     => $appointment->id,
            'status' => 'confirmed',
        ]);
    }

    // ── Doctor Can Cancel Appointment ──

    public function test_doctor_can_cancel_appointment_and_slot_released(): void
    {
        $appointment = Appointment::factory()->create([
            'doctor_id'  => $this->doctor->id,
            'patient_id' => $this->patient->id,
            'slot_id'    => $this->slot->id,
            'status'     => 'confirmed',
            'created_by' => $this->patient->id,
        ]);

        // Mark slot as booked
        $this->slot->update(['is_available' => false]);

        Sanctum::actingAs($this->doctor);

        $response = $this->putJson("/api/appointments/{$appointment->id}", [
            'status' => 'cancelled',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        // Slot should be released
        $this->slot->refresh();
        $this->assertTrue($this->slot->is_available);
    }

    // ── Duplicate Booking Prevention ──

    public function test_cannot_book_unavailable_slot(): void
    {
        // Mark slot as taken
        $this->slot->update(['is_available' => false]);

        Sanctum::actingAs($this->patient);

        $response = $this->postJson('/api/appointments', [
            'doctor_id'        => $this->doctor->id,
            'patient_id'       => $this->patient->id,
            'appointment_type' => 'inPerson',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date,
            'appointment_time' => $this->slot->start_time,
        ]);

        // Should fail with 422 (slot unavailable)
        $response->assertStatus(422);
    }

    // ── Soft Delete ──

    public function test_deleted_appointment_is_soft_deleted(): void
    {
        $appointment = Appointment::factory()->create([
            'doctor_id'  => $this->doctor->id,
            'patient_id' => $this->patient->id,
            'slot_id'    => $this->slot->id,
            'status'     => 'pending',
            'created_by' => $this->patient->id,
        ]);

        Sanctum::actingAs($this->doctor);

        $this->deleteJson("/api/appointments/{$appointment->id}")
            ->assertOk();

        // Should be soft-deleted (still in DB with deleted_at)
        $this->assertSoftDeleted('appointments', ['id' => $appointment->id]);
    }

    // ── Unauthenticated cannot book ──

    public function test_unauthenticated_cannot_book(): void
    {
        $this->postJson('/api/appointments', [
            'doctor_id'        => $this->doctor->id,
            'appointment_type' => 'inPerson',
            'slot_id'          => $this->slot->id,
            'appointment_date' => $this->slot->slot_date,
            'appointment_time' => $this->slot->start_time,
        ])->assertStatus(401);
    }
}
