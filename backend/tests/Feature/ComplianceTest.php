<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\DigitalAnamnesis;
use App\Models\HealthDataAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ComplianceTest extends TestCase
{
    use DatabaseMigrations;

    // ── Encrypted Casts: Data stored encrypted in DB ──

    public function test_doctor_note_is_encrypted_in_database(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patient = User::factory()->patient()->create();
        $slot = CalendarSlot::factory()->create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $clinic->id,
        ]);

        $appointment = Appointment::factory()->create([
            'patient_id'  => $patient->id,
            'doctor_id'   => $doctor->id,
            'clinic_id'   => $clinic->id,
            'slot_id'     => $slot->id,
            'doctor_note' => 'Sensitive diagnosis info',
        ]);

        // Raw DB value must NOT be plaintext
        $raw = DB::table('appointments')
            ->where('id', $appointment->id)
            ->value('doctor_note');

        $this->assertNotEquals('Sensitive diagnosis info', $raw);
        $this->assertNotEmpty($raw);

        // Eloquent model must auto-decrypt
        $appointment->refresh();
        $this->assertEquals('Sensitive diagnosis info', $appointment->doctor_note);
    }

    public function test_medical_history_is_encrypted_in_database(): void
    {
        $user = User::factory()->create([
            'medical_history' => 'Diabetes Type 2, Hypertension',
        ]);

        $raw = DB::table('users')
            ->where('id', $user->id)
            ->value('medical_history');

        $this->assertNotEquals('Diabetes Type 2, Hypertension', $raw);

        $user->refresh();
        $this->assertEquals('Diabetes Type 2, Hypertension', $user->medical_history);
    }

    public function test_anamnesis_answers_are_encrypted_in_database(): void
    {
        $patient = User::factory()->patient()->create();
        $doctor  = User::factory()->doctor()->create();

        $anamnesis = DigitalAnamnesis::updateOrCreate(
            ['patient_id' => $patient->id],
            [
                'doctor_id'  => $doctor->id,
                'answers'    => ['allergy' => 'Penicillin', 'blood_type' => 'A+'],
                'is_active'  => true,
            ]
        );

        $raw = DB::table('digital_anamneses')
            ->where('id', $anamnesis->id)
            ->value('answers');

        // Raw value should be encrypted ciphertext, not JSON
        $this->assertStringNotContainsString('Penicillin', $raw);

        $anamnesis->refresh();
        $this->assertEquals('Penicillin', $anamnesis->answers['allergy']);
        $this->assertEquals('A+', $anamnesis->answers['blood_type']);
    }

    // ── Audit Log: Access logging on show endpoints ──

    public function test_audit_log_created_on_appointment_view(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patient = User::factory()->patient()->create();
        $slot = CalendarSlot::factory()->create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $clinic->id,
        ]);

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'clinic_id'  => $clinic->id,
            'slot_id'    => $slot->id,
        ]);

        Sanctum::actingAs($doctor);
        $this->getJson("/api/appointments/{$appointment->id}");

        $this->assertDatabaseHas('health_data_audit_logs', [
            'accessor_id'   => $doctor->id,
            'patient_id'    => $patient->id,
            'resource_type' => 'appointment',
            'resource_id'   => $appointment->id,
        ]);
    }

    public function test_audit_log_created_on_anamnesis_view(): void
    {
        $patient = User::factory()->patient()->create();
        $doctor  = User::factory()->doctor()->create();

        DigitalAnamnesis::updateOrCreate(
            ['patient_id' => $patient->id],
            [
                'doctor_id'  => $doctor->id,
                'answers'    => ['test' => 'value'],
                'is_active'  => true,
            ]
        );

        Sanctum::actingAs($doctor);
        $this->getJson("/api/anamnesis/{$patient->id}");

        $this->assertDatabaseHas('health_data_audit_logs', [
            'accessor_id'   => $doctor->id,
            'patient_id'    => $patient->id,
            'resource_type' => 'digital_anamnesis',
        ]);
    }

    public function test_audit_log_records_ip_address(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patient = User::factory()->patient()->create();
        $slot = CalendarSlot::factory()->create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $clinic->id,
        ]);

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'clinic_id'  => $clinic->id,
            'slot_id'    => $slot->id,
        ]);

        Sanctum::actingAs($doctor);
        $this->getJson("/api/appointments/{$appointment->id}");

        $log = HealthDataAuditLog::first();
        $this->assertNotNull($log);
        $this->assertNotNull($log->ip_address);
        $this->assertNotNull($log->created_at);
    }

    public function test_multiple_accesses_create_multiple_audit_logs(): void
    {
        $clinic = Clinic::factory()->create();
        $doctor = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $patient = User::factory()->patient()->create();
        $slot = CalendarSlot::factory()->create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $clinic->id,
        ]);

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'clinic_id'  => $clinic->id,
            'slot_id'    => $slot->id,
        ]);

        // Access 3 times
        Sanctum::actingAs($doctor);
        $this->getJson("/api/appointments/{$appointment->id}");
        Sanctum::actingAs($doctor);
        $this->getJson("/api/appointments/{$appointment->id}");
        Sanctum::actingAs($patient);
        $this->getJson("/api/appointments/{$appointment->id}");

        $this->assertEquals(3, HealthDataAuditLog::count());
    }
}
