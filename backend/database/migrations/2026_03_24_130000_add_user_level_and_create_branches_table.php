<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * MedaGama User Level System & Hospital Branches
 *
 * Levels:
 *   1 = Patient
 *   2 = Doctor
 *   3 = Clinic (clinicOwner) — can use platform features (appointments, telehealth) without verification
 *   4 = Hospital — promotion network only, NO appointment system, CAN manage branches
 *   5 = Admin (superAdmin / saasAdmin)
 *
 * Business rules:
 *   • Level 3 users bypass doctor-verification gates for appointments/telehealth.
 *   • Level 4 users have NO appointment capability; they are a "Tanıtım Ağı" (Promotion Network).
 *   • CRM is a separate premium product gated by has_crm_subscription (is_crm_active + crm_expires_at).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Add user_level + has_crm_subscription helper to users ──
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('user_level')->default(1)->after('role_id')
                  ->comment('1=patient, 2=doctor, 3=clinic, 4=hospital, 5=admin');
            $table->index('user_level');
        });

        // Backfill existing users based on role_id
        DB::statement("UPDATE users SET user_level = CASE
            WHEN role_id = 'patient'     THEN 1
            WHEN role_id = 'doctor'      THEN 2
            WHEN role_id = 'clinicOwner' THEN 3
            WHEN role_id = 'clinic'      THEN 3
            WHEN role_id = 'hospital'    THEN 4
            WHEN role_id IN ('superAdmin','saasAdmin') THEN 5
            ELSE 1
        END");

        // ── 2. Create branches table for Level 4 (Hospitals) ──
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('hospital_id');
            $table->foreign('hospital_id')->references('id')->on('hospitals')->cascadeOnDelete();

            $table->string('name', 255);
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('hospital_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['user_level']);
            $table->dropColumn('user_level');
        });
    }
};
