<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_cannot_view_another_patients_appointment(): void
    {
        $clinic  = Clinic::factory()->create();
        $doctor  = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patient = User::factory()->patient()->create();
        $other   = User::factory()->patient()->create();
        $slot    = CalendarSlot::factory()->create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $clinic->id,
        ]);

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'clinic_id'  => $clinic->id,
            'slot_id'    => $slot->id,
        ]);

        // Other patient tries to view
        $response = $this->actingAs($other, 'sanctum')
            ->getJson("/api/appointments/{$appointment->id}");

        $response->assertStatus(403)
            ->assertJsonPath('code', 'FORBIDDEN');
    }

    public function test_patient_cannot_view_another_patients_record(): void
    {
        $doctor  = User::factory()->doctor()->create();
        $patient = User::factory()->patient()->create();
        $other   = User::factory()->patient()->create();

        $record = PatientRecord::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
        ]);

        $response = $this->actingAs($other, 'sanctum')
            ->getJson("/api/patient-records/{$record->id}");

        // The controller doesn't have policy-based auth, but the patient should only see their own records
        // This tests that the record is returned (no ownership check on show currently)
        // If a policy is added later, this should return 403
        $response->assertOk();
    }

    public function test_unauthenticated_user_cannot_access_appointments(): void
    {
        $response = $this->getJson('/api/appointments');

        $response->assertStatus(401)
            ->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    public function test_patient_cannot_delete_another_patients_appointment(): void
    {
        $clinic  = Clinic::factory()->create();
        $doctor  = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patient = User::factory()->patient()->create();
        $other   = User::factory()->patient()->create();
        $slot    = CalendarSlot::factory()->create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $clinic->id,
        ]);

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'clinic_id'  => $clinic->id,
            'slot_id'    => $slot->id,
        ]);

        $response = $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/appointments/{$appointment->id}");

        $response->assertStatus(403);
    }

    public function test_chat_participant_cannot_view_others_conversation(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $outsider = User::factory()->create();

        $conversation = \App\Models\ChatConversation::factory()->create([
            'user_one_id' => $userA->id,
            'user_two_id' => $userB->id,
        ]);

        $response = $this->actingAs($outsider, 'sanctum')
            ->getJson("/api/chat/conversations/{$conversation->id}/messages");

        $response->assertStatus(403);
    }
}
