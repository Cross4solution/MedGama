<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Branches system for L4 (Hospitals) — Multi-location management.
     *
     * Business rules
     * ──────────────
     * • A Hospital manages multiple Branches (physical locations).
     * • Clinics can be assigned to Branches (Many-to-Many via clinic_branches).
     * • Doctors can be assigned to Branches with per-branch schedules (doctor_branches).
     *
     * Technical
     * ─────────
     * • UUID primary keys everywhere.
     * • Soft Deletes on branches table.
     * • JSON schedule field for doctor working hours per branch.
     * • Coordinates stored as JSON {lat, lng} for map display.
     */
    public function up(): void
    {
        // ── 1. Create branches table ───────────────────────────────────────
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('hospital_id')->index();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->json('coordinates')->nullable();       // {lat, lng}
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('hospital_id')
                  ->references('id')->on('hospitals')
                  ->onDelete('cascade');

            $table->index(['hospital_id', 'is_active']);
        });

        // ── 2. Clinic ↔ Branch (Many-to-Many) ─────────────────────────────
        Schema::create('clinic_branches', function (Blueprint $table) {
            $table->uuid('clinic_id');
            $table->uuid('branch_id');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->primary(['clinic_id', 'branch_id']);

            $table->foreign('clinic_id')
                  ->references('id')->on('clinics')
                  ->onDelete('cascade');

            $table->foreign('branch_id')
                  ->references('id')->on('branches')
                  ->onDelete('cascade');
        });

        // ── 3. Doctor ↔ Branch (Assignments with schedule) ────────────────
        Schema::create('doctor_branches', function (Blueprint $table) {
            $table->uuid('doctor_id');
            $table->uuid('branch_id');
            $table->json('schedule')->nullable();          // Working hours per branch
            $table->timestamps();

            $table->primary(['doctor_id', 'branch_id']);

            $table->foreign('doctor_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');

            $table->foreign('branch_id')
                  ->references('id')->on('branches')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_branches');
        Schema::dropIfExists('clinic_branches');
        Schema::dropIfExists('branches');
    }
};
