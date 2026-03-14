<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hospital entity + relations to clinics and users.
     *
     * Business rules
     * ──────────────
     * • A Hospital (Hastane) can own many Clinics  (One-to-Many).
     * • Clinics still keep their own owner_id (clinic-level admin).
     * • Users may optionally belong to a Hospital (hospital staff / admin).
     * • New role_id value: "hospital" — represents hospital-level administrators.
     *
     * Technical
     * ─────────
     * • UUID primary keys everywhere.
     * • Soft Deletes + GDPR 3-year prunable on hospitals table.
     * • Encrypted fields for health-data-capable columns (contact_email kept as
     *   plain text because it is used for lookup; notes/bio encrypted).
     */
    public function up(): void
    {
        // ── 1. Create hospitals table ────────────────────────────────────
        Schema::create('hospitals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');                         // Public display name
            $table->string('codename')->unique();           // URL-friendly slug
            $table->string('fullname')->nullable();         // Legal / full name
            $table->string('avatar')->nullable();           // Logo / image URL
            $table->uuid('owner_id')->nullable()->index();  // Primary admin (User)
            $table->string('address')->nullable();
            $table->text('biography')->nullable();          // Will be encrypted in model
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->json('map_coordinates')->nullable();    // {lat, lng}
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('tax_number')->nullable();       // Encrypted in model (sensitive)
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('owner_id')
                  ->references('id')->on('users')
                  ->nullOnDelete();
        });

        // ── 2. Add hospital_id to clinics ────────────────────────────────
        Schema::table('clinics', function (Blueprint $table) {
            $table->uuid('hospital_id')->nullable()->after('owner_id')->index();
            $table->softDeletes();

            $table->foreign('hospital_id')
                  ->references('id')->on('hospitals')
                  ->nullOnDelete();
        });

        // ── 3. Add hospital_id to users ──────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('hospital_id')->nullable()->after('clinic_id')->index();

            $table->foreign('hospital_id')
                  ->references('id')->on('hospitals')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Reverse in dependency order
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->dropColumn('hospital_id');
        });

        Schema::table('clinics', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->dropColumn('hospital_id');
            $table->dropSoftDeletes();
        });

        Schema::dropIfExists('hospitals');
    }
};
