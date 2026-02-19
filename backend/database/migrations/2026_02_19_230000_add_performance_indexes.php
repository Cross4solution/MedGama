<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Users — frequently queried fields
        Schema::table('users', function (Blueprint $table) {
            $table->index('email', 'idx_users_email');
            $table->index('mobile', 'idx_users_mobile');
            $table->index('role_id', 'idx_users_role_id');
            $table->index('is_active', 'idx_users_is_active');
            $table->index('clinic_id', 'idx_users_clinic_id');
        });

        // Appointments — date range and status filtering
        if (Schema::hasTable('appointments')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->index('appointment_date', 'idx_appointments_date');
                $table->index('status', 'idx_appointments_status');
                $table->index(['doctor_id', 'appointment_date'], 'idx_appointments_doctor_date');
                $table->index(['patient_id', 'status'], 'idx_appointments_patient_status');
            });
        }

        // Personal access tokens — fast token lookup
        if (Schema::hasTable('personal_access_tokens')) {
            // Laravel may already have this, but ensure compound index
            $table = 'personal_access_tokens';
            if (!Schema::hasIndex($table, 'idx_pat_tokenable')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->index(['tokenable_type', 'tokenable_id'], 'idx_pat_tokenable');
                });
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_email');
            $table->dropIndex('idx_users_mobile');
            $table->dropIndex('idx_users_role_id');
            $table->dropIndex('idx_users_is_active');
            $table->dropIndex('idx_users_clinic_id');
        });

        if (Schema::hasTable('appointments')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropIndex('idx_appointments_date');
                $table->dropIndex('idx_appointments_status');
                $table->dropIndex('idx_appointments_doctor_date');
                $table->dropIndex('idx_appointments_patient_status');
            });
        }
    }
};
