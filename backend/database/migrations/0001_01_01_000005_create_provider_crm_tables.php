<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Calendar Slots — Doctor availability
        Schema::create('calendar_slots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('doctor_id')->index();
            $table->uuid('clinic_id')->nullable()->index();
            $table->date('slot_date');
            $table->string('start_time'); // HH:MM format
            $table->integer('duration_minutes')->default(30);
            $table->boolean('is_available')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('doctor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            $table->unique(['doctor_id', 'slot_date', 'start_time']);
        });

        // Appointments
        Schema::create('appointments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->index();
            $table->uuid('doctor_id')->index();
            $table->uuid('clinic_id')->nullable()->index();
            $table->enum('appointment_type', ['inPerson', 'online'])->default('inPerson');
            $table->uuid('slot_id')->nullable();
            $table->date('appointment_date');
            $table->string('appointment_time'); // HH:MM
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->string('confirmation_note')->nullable();
            $table->string('video_conference_link')->nullable(); // Phase 2 placeholder
            $table->text('doctor_note')->nullable(); // Private
            $table->uuid('created_by');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('doctor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            $table->foreign('slot_id')->references('id')->on('calendar_slots')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index('status');
            $table->index('appointment_date');
        });

        // Digital Anamnesis — Patient health history (JSON answers)
        Schema::create('digital_anamneses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->index();
            $table->uuid('doctor_id')->nullable();
            $table->uuid('clinic_id')->nullable();
            $table->json('answers'); // Flexible JSON anamnesis data
            $table->uuid('last_updated_by')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('doctor_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            $table->unique('patient_id'); // One anamnesis per patient
        });

        // Patient Records — Medical files (URL references only)
        Schema::create('patient_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->index();
            $table->uuid('clinic_id')->nullable()->index();
            $table->uuid('doctor_id')->nullable();
            $table->string('file_url'); // External storage URL (S3 etc.)
            $table->date('upload_date')->nullable();
            $table->enum('record_type', ['labResult', 'report', 'scan', 'other'])->default('other');
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            $table->foreign('doctor_id')->references('id')->on('users')->nullOnDelete();
        });

        // CRM Tags — Doctor's private tags on patients
        Schema::create('crm_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('doctor_id')->index();
            $table->uuid('patient_id')->index();
            $table->uuid('clinic_id')->nullable()->index();
            $table->string('tag');
            $table->uuid('created_by');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('doctor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });

        // CRM Process Stages — Patient journey tracking
        Schema::create('crm_process_stages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('doctor_id')->index();
            $table->uuid('patient_id')->index();
            $table->uuid('clinic_id')->nullable()->index();
            $table->string('stage'); // "New Patient", "Post-Surgery", etc.
            $table->date('started_at')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('doctor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
        });

        // Archived Clinic Records — When doctor leaves clinic
        Schema::create('archived_clinic_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('former_doctor_id')->index();
            $table->uuid('clinic_id')->index();
            $table->uuid('archived_patient_id')->index();
            $table->json('record_references')->nullable(); // Array of patient_record IDs
            $table->date('archived_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('former_doctor_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->cascadeOnDelete();
            $table->foreign('archived_patient_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archived_clinic_records');
        Schema::dropIfExists('crm_process_stages');
        Schema::dropIfExists('crm_tags');
        Schema::dropIfExists('patient_records');
        Schema::dropIfExists('digital_anamneses');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('calendar_slots');
    }
};
