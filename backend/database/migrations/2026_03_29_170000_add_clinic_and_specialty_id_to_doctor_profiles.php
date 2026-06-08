<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->uuid('clinic_id')->nullable()->after('user_id');
            $table->uuid('specialty_id')->nullable()->after('specialty');

            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            $table->foreign('specialty_id')->references('id')->on('specialties')->nullOnDelete();
            $table->index('clinic_id');
            $table->index('specialty_id');
        });

        // Backfill clinic_id from users table
        \Illuminate\Support\Facades\DB::statement("
            UPDATE doctor_profiles
            SET clinic_id = (SELECT clinic_id FROM users WHERE users.id = doctor_profiles.user_id)
        ");
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropForeign(['clinic_id']);
            $table->dropForeign(['specialty_id']);
            $table->dropColumn(['clinic_id', 'specialty_id']);
        });
    }
};
