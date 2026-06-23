<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Snapshot of the patient's medical history + symptoms at booking time,
            // so it travels with the appointment for the doctor. PHI → encrypted cast.
            $table->text('patient_medical_snapshot')->nullable()->after('doctor_note');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('patient_medical_snapshot');
        });
    }
};
