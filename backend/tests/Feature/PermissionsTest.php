<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Critical Path #3 — Role-Based Access Control (Permissions)
 *
 * Ensures:
 *  - Patients cannot access doctor CRM / admin endpoints
 *  - Doctors cannot access SuperAdmin endpoints
 *  - Cross-patient data isolation (patient A cannot see patient B's appointment)
 */
class PermissionsTest extends TestCase
{
    use RefreshDatabase;

    // ═══════════════════════════════════════════
    //  Patient → Doctor CRM Endpoints (BLOCKED)
    // ═══════════════════════════════════════════

    public function test_patient_cannot_access_crm_patients_list(): void
    {
        $patient = User::factory()->patient()->create();
        Sanctum::actingAs($patient);

        $response = $this->getJson('/api/crm/patients');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Patient should not access CRM patients. Got: {$response->status()}"
        );
    }

    public function test_patient_cannot_access_crm_dashboard(): void
    {
        $patient = User::factory()->patient()->create();
        Sanctum::actingAs($patient);

        $response = $this->getJson('/api/crm/dashboard');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Patient should not access CRM dashboard. Got: {$response->status()}"
        );
    }

    public function test_patient_cannot_access_crm_revenue(): void
    {
        $patient = User::factory()->patient()->create();
        Sanctum::actingAs($patient);

        $response = $this->getJson('/api/crm/revenue');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Patient should not access CRM revenue. Got: {$response->status()}"
        );
    }

    // ═══════════════════════════════════════════
    //  Doctor → SuperAdmin Endpoints (BLOCKED)
    // ═══════════════════════════════════════════

    public function test_doctor_cannot_access_admin_dashboard(): void
    {
        $doctor = User::factory()->doctor()->create();
        Sanctum::actingAs($doctor);

        $response = $this->getJson('/api/admin/dashboard');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Doctor should not access admin dashboard. Got: {$response->status()}"
        );
    }

    public function test_doctor_cannot_access_admin_user_management(): void
    {
        $doctor = User::factory()->doctor()->create();
        Sanctum::actingAs($doctor);

        $response = $this->getJson('/api/admin/users');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Doctor should not access admin user management. Got: {$response->status()}"
        );
    }

    public function test_doctor_cannot_verify_other_doctors(): void
    {
        $doctor = User::factory()->doctor()->create();
        $otherDoctor = User::factory()->doctor()->create();
        Sanctum::actingAs($doctor);

        $response = $this->putJson("/api/admin/doctors/{$otherDoctor->id}/verify", [
            'is_verified' => true,
        ]);

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Doctor should not verify others. Got: {$response->status()}"
        );
    }

    public function test_doctor_cannot_access_admin_audit_logs(): void
    {
        $doctor = User::factory()->doctor()->create();
        Sanctum::actingAs($doctor);

        $response = $this->getJson('/api/admin/audit-logs');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Doctor should not access admin audit logs. Got: {$response->status()}"
        );
    }

    // ═══════════════════════════════════════════
    //  Patient → SuperAdmin Endpoints (BLOCKED)
    // ═══════════════════════════════════════════

    public function test_patient_cannot_access_admin_dashboard(): void
    {
        $patient = User::factory()->patient()->create();
        Sanctum::actingAs($patient);

        $response = $this->getJson('/api/admin/dashboard');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Patient should not access admin dashboard. Got: {$response->status()}"
        );
    }

    public function test_patient_cannot_manage_admin_tickets(): void
    {
        $patient = User::factory()->patient()->create();
        Sanctum::actingAs($patient);

        $response = $this->getJson('/api/admin/tickets');

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Patient should not access admin tickets. Got: {$response->status()}"
        );
    }

    // ═══════════════════════════════════════════
    //  SuperAdmin CAN access admin endpoints
    // ═══════════════════════════════════════════

    public function test_superadmin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/dashboard');

        $response->assertOk();
    }

    // ═══════════════════════════════════════════
    //  Cross-Patient Data Isolation
    // ═══════════════════════════════════════════

    public function test_patient_cannot_view_other_patients_appointment(): void
    {
        $patientA = User::factory()->patient()->create();
        $patientB = User::factory()->patient()->create();
        $doctor   = User::factory()->doctor()->create();

        $appointment = Appointment::factory()->create([
            'doctor_id'  => $doctor->id,
            'patient_id' => $patientA->id,
            'status'     => 'pending',
            'created_by' => $patientA->id,
        ]);

        // Patient B tries to view Patient A's appointment
        Sanctum::actingAs($patientB);

        $response = $this->getJson("/api/appointments/{$appointment->id}");

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Patient B should not see Patient A's appointment. Got: {$response->status()}"
        );
    }

    public function test_patient_cannot_update_other_patients_appointment(): void
    {
        $patientA = User::factory()->patient()->create();
        $patientB = User::factory()->patient()->create();
        $doctor   = User::factory()->doctor()->create();

        $appointment = Appointment::factory()->create([
            'doctor_id'  => $doctor->id,
            'patient_id' => $patientA->id,
            'status'     => 'pending',
            'created_by' => $patientA->id,
        ]);

        Sanctum::actingAs($patientB);

        $response = $this->putJson("/api/appointments/{$appointment->id}", [
            'status' => 'cancelled',
        ]);

        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Patient B should not modify Patient A's appointment. Got: {$response->status()}"
        );
    }

    // ═══════════════════════════════════════════
    //  Unverified Doctor — Critical Actions Blocked
    // ═══════════════════════════════════════════

    public function test_unverified_doctor_cannot_create_appointment(): void
    {
        $doctor = User::factory()->doctor()->unverified()->create();
        Sanctum::actingAs($doctor);

        $response = $this->postJson('/api/appointments', [
            'patient_id'  => User::factory()->patient()->create()->id,
            'date'        => now()->addDay()->toDateString(),
            'time'        => '10:00',
            'duration'    => 30,
            'type'        => 'in_person',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'DOCTOR_NOT_VERIFIED');
    }

    public function test_unverified_doctor_cannot_create_medstream_post(): void
    {
        $doctor = User::factory()->doctor()->unverified()->create();
        Sanctum::actingAs($doctor);

        $response = $this->postJson('/api/medstream/posts', [
            'content'   => 'Test post from unverified doctor',
            'post_type' => 'text',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'DOCTOR_NOT_VERIFIED');
    }

    public function test_unverified_doctor_cannot_comment_on_medstream(): void
    {
        // Create a post by a verified doctor first
        $verifiedDoctor = User::factory()->doctor()->create();
        $post = \App\Models\MedStreamPost::factory()->create([
            'author_id' => $verifiedDoctor->id,
        ]);

        $unverifiedDoctor = User::factory()->doctor()->unverified()->create();
        Sanctum::actingAs($unverifiedDoctor);

        $response = $this->postJson("/api/medstream/posts/{$post->id}/comments", [
            'body' => 'Test comment from unverified doctor',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'DOCTOR_NOT_VERIFIED');
    }

    public function test_unverified_doctor_can_read_medstream_feed(): void
    {
        $doctor = User::factory()->doctor()->unverified()->create();
        Sanctum::actingAs($doctor);

        $response = $this->getJson('/api/medstream/feed');

        // Feed read should be allowed (200 or empty list — NOT 403)
        $this->assertNotEquals(403, $response->status(), 'Unverified doctor should be able to READ MedStream feed');
    }

    public function test_verified_doctor_can_create_medstream_post(): void
    {
        $doctor = User::factory()->doctor()->create(); // is_verified = true by default
        Sanctum::actingAs($doctor);

        $response = $this->postJson('/api/medstream/posts', [
            'content'   => 'Test post from verified doctor',
            'post_type' => 'text',
        ]);

        // Should NOT be 403 (may be 422 validation or 201 created)
        $this->assertNotEquals(403, $response->status(), 'Verified doctor should be able to create MedStream post');
    }

    public function test_patient_passes_through_verified_doctor_middleware(): void
    {
        // Patients are not doctors — the middleware should not block them
        $patient = User::factory()->patient()->create(['is_verified' => false]);
        Sanctum::actingAs($patient);

        $response = $this->postJson('/api/medstream/posts', [
            'content'   => 'Test post from patient',
            'post_type' => 'text',
        ]);

        // Should NOT be 403 with DOCTOR_NOT_VERIFIED code
        // (may fail for other reasons like validation, but not doctor verification)
        if ($response->status() === 403) {
            $this->assertNotEquals('DOCTOR_NOT_VERIFIED', $response->json('code'),
                'Patient should not be blocked by doctor verification middleware');
        } else {
            $this->assertTrue(true);
        }
    }

    // ═══════════════════════════════════════════
    //  Unauthenticated — Everything Blocked
    // ═══════════════════════════════════════════

    public function test_unauthenticated_cannot_access_any_protected_route(): void
    {
        // Auth-protected routes return 401; nested middleware groups may return 401 or 404
        $this->getJson('/api/appointments')->assertStatus(401);
        $this->getJson('/api/auth/me')->assertStatus(401);

        $crmStatus = $this->getJson('/api/crm/dashboard')->status();
        $this->assertTrue(in_array($crmStatus, [401, 403, 404]), "CRM should block unauthenticated. Got: {$crmStatus}");

        $adminStatus = $this->getJson('/api/admin/dashboard')->status();
        $this->assertTrue(in_array($adminStatus, [401, 403, 404]), "Admin should block unauthenticated. Got: {$adminStatus}");
    }
}
