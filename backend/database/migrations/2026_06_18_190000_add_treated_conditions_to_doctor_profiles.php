<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            // Conditions/symptoms the doctor treats — powers Vasco symptom→doctor matching.
            $table->json('treated_conditions')->nullable()->after('sub_specialties');
        });
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropColumn('treated_conditions');
        });
    }
};
