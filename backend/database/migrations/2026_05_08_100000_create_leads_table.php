<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sales CRM — Leads pipeline.
     *
     * TiDB/MySQL-compatible:
     *  • ENUM for stage (no DROP CONSTRAINT needed; pgsql gets a string fallback below).
     *  • TEXT columns are nullable (no ->default('')).
     *  • UUID FKs, no TEXT in any index.
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('clinic_id')->index();
            $table->uuid('assigned_to')->nullable()->index(); // salesperson user_id

            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('source')->nullable();             // web / referral / manual ...
            $table->string('treatment_interest')->nullable();

            // Pipeline stage — ENUM on MySQL/TiDB, plain string on pgsql/sqlite
            $table->enum('stage', ['new', 'contacted', 'proposal', 'won', 'lost'])
                ->default('new')
                ->index();

            $table->text('notes')->nullable();                // encrypted at model layer (PHI)
            $table->decimal('estimated_value', 12, 2)->nullable();
            $table->string('lost_reason')->nullable();

            $table->uuid('converted_patient_id')->nullable()->index(); // created patient user_id

            $table->timestamp('last_contacted_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('clinic_id')->references('id')->on('clinics')->cascadeOnDelete();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->foreign('converted_patient_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
