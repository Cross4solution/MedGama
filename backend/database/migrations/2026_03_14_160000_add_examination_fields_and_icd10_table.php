<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Examination & Prescription module (Bölüm 7.4):
     *
     * 1. patient_records → appointment_id, icd10_code, diagnosis_note,
     *    vitals (JSON), examination_note, prescriptions (JSON)
     * 2. icd10_codes → ICD-10 catalog table for search
     * 3. Expand record_type enum to include 'examination'
     *
     * GDPR: diagnosis_note, examination_note are stored as TEXT
     * and encrypted at the application layer via Eloquent casts.
     * vitals and prescriptions are encrypted:array casts.
     */
    public function up(): void
    {
        // ── 1. ICD-10 Codes catalog table ──
        Schema::create('icd10_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 10)->unique()->index();       // e.g. "J06.9"
            $table->string('category', 50)->nullable()->index();  // e.g. "J00-J99"
            $table->json('name');                                  // {"en": "...", "tr": "..."}
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── 2. Expand patient_records with examination/prescription fields ──
        Schema::table('patient_records', function (Blueprint $table) {
            $table->uuid('appointment_id')->nullable()->after('doctor_id')->index();
            $table->string('icd10_code', 10)->nullable()->after('record_type');
            $table->text('diagnosis_note')->nullable()->after('icd10_code');
            $table->text('vitals')->nullable()->after('diagnosis_note');
            $table->text('examination_note')->nullable()->after('vitals');
            $table->text('prescriptions')->nullable()->after('examination_note');

            $table->foreign('appointment_id')
                  ->references('id')->on('appointments')
                  ->nullOnDelete();
        });

        // ── 3. Expand record_type enum to include 'examination' ──
        $driver = \DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            \DB::statement("ALTER TABLE patient_records DROP CONSTRAINT IF EXISTS patient_records_record_type_check");
            \DB::statement("ALTER TABLE patient_records ADD CONSTRAINT patient_records_record_type_check CHECK (record_type::text = ANY (ARRAY['labResult','report','scan','other','examination']))");
        } elseif ($driver === 'mysql') {
            \DB::statement("ALTER TABLE patient_records MODIFY COLUMN record_type ENUM('labResult','report','scan','other','examination') DEFAULT 'other'");
        }
    }

    public function down(): void
    {
        Schema::table('patient_records', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropColumn([
                'appointment_id', 'icd10_code', 'diagnosis_note',
                'vitals', 'examination_note', 'prescriptions',
            ]);
        });

        $driver = \DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            \DB::statement("ALTER TABLE patient_records DROP CONSTRAINT IF EXISTS patient_records_record_type_check");
            \DB::statement("ALTER TABLE patient_records ADD CONSTRAINT patient_records_record_type_check CHECK (record_type::text = ANY (ARRAY['labResult','report','scan','other']))");
        } elseif ($driver === 'mysql') {
            \DB::statement("ALTER TABLE patient_records MODIFY COLUMN record_type ENUM('labResult','report','scan','other') DEFAULT 'other'");
        }

        Schema::dropIfExists('icd10_codes');
    }
};
