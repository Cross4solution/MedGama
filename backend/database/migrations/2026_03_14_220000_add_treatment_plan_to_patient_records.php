<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bölüm 4.2 / 7.4 — Add treatment_plan field for structured treatment planning.
     * Encrypted at rest via Eloquent 'encrypted' cast (GDPR Art. 9).
     */
    public function up(): void
    {
        Schema::table('patient_records', function (Blueprint $table) {
            $table->text('treatment_plan')->nullable()->after('examination_note');
        });
    }

    public function down(): void
    {
        Schema::table('patient_records', function (Blueprint $table) {
            $table->dropColumn('treatment_plan');
        });
    }
};
