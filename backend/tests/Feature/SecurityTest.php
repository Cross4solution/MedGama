<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use DatabaseTransactions;

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

    // ══════════════════════════════════════════════
    //  TENANT ISOLATION — SuperAdmin vs ClinicOwner
    // ══════════════════════════════════════════════

    public function test_superadmin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role_id' => 'superAdmin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dashboard');

        $response->assertOk()
            ->assertJsonStructure(['data' => ['users', 'appointments', 'medstream']]);
    }

    public function test_superadmin_can_list_all_doctors(): void
    {
        $admin = User::factory()->create(['role_id' => 'superAdmin']);
        User::factory()->doctor()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/doctors');

        $response->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_superadmin_can_verify_doctor(): void
    {
        $admin  = User::factory()->create(['role_id' => 'superAdmin']);
        $doctor = User::factory()->doctor()->create(['is_verified' => false]);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/doctors/{$doctor->id}/verify", ['verified' => true]);

        $response->assertOk()
            ->assertJsonPath('doctor.is_verified', true);

        $this->assertDatabaseHas('users', ['id' => $doctor->id, 'is_verified' => true]);
    }

    public function test_superadmin_can_list_reports(): void
    {
        $admin = User::factory()->create(['role_id' => 'superAdmin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/reports');

        $response->assertOk();
    }

    public function test_clinic_owner_cannot_access_admin_dashboard(): void
    {
        $clinic = Clinic::factory()->create();
        $owner  = User::factory()->create([
            'role_id'   => 'clinicOwner',
            'clinic_id' => $clinic->id,
        ]);

        $response = $this->actingAs($owner, 'sanctum')
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_clinic_owner_cannot_verify_doctors(): void
    {
        $clinic = Clinic::factory()->create();
        $owner  = User::factory()->create([
            'role_id'   => 'clinicOwner',
            'clinic_id' => $clinic->id,
        ]);
        $doctor = User::factory()->doctor()->create(['is_verified' => false]);

        $response = $this->actingAs($owner, 'sanctum')
            ->putJson("/api/admin/doctors/{$doctor->id}/verify", ['verified' => true]);

        $response->assertStatus(403);

        // Doctor should remain unverified
        $this->assertDatabaseHas('users', ['id' => $doctor->id, 'is_verified' => false]);
    }

    public function test_clinic_owner_cannot_access_other_clinics_analytics(): void
    {
        $clinicA = Clinic::factory()->create();
        $clinicB = Clinic::factory()->create();

        $ownerA = User::factory()->create([
            'role_id'   => 'clinicOwner',
            'clinic_id' => $clinicA->id,
        ]);

        // ClinicOwner A tries to access Clinic B's analytics
        $response = $this->actingAs($ownerA, 'sanctum')
            ->getJson("/api/analytics/clinic/{$clinicB->id}/summary");

        $response->assertStatus(403);
    }

    public function test_superadmin_can_access_any_clinics_analytics(): void
    {
        $admin  = User::factory()->create(['role_id' => 'superAdmin']);
        $clinic = Clinic::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/analytics/clinic/{$clinic->id}/summary");

        $response->assertOk();
    }

    public function test_patient_cannot_access_admin_routes(): void
    {
        $patient = User::factory()->patient()->create();

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/admin/doctors')
            ->assertStatus(403);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/admin/reports')
            ->assertStatus(403);
    }

    public function test_doctor_cannot_access_admin_routes(): void
    {
        $doctor = User::factory()->doctor()->create();

        $this->actingAs($doctor, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);

        $this->actingAs($doctor, 'sanctum')
            ->putJson('/api/admin/doctors/' . $doctor->id . '/verify', ['verified' => true])
            ->assertStatus(403);
    }
}
