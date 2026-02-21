<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Helper: create index only if it doesn't already exist (all drivers)
        $createIfNotExists = function (string $table, string $indexName, string $columns) {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'pgsql' || $driver === 'sqlite') {
                DB::statement("CREATE INDEX IF NOT EXISTS {$indexName} ON {$table} ({$columns})");
            } else {
                // MySQL — check information_schema
                $exists = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
                if (empty($exists)) {
                    DB::statement("CREATE INDEX {$indexName} ON {$table} ({$columns})");
                }
            }
        };

        // Users — frequently queried fields
        $createIfNotExists('users', 'idx_users_email', 'email');
        $createIfNotExists('users', 'idx_users_mobile', 'mobile');
        $createIfNotExists('users', 'idx_users_role_id', 'role_id');
        $createIfNotExists('users', 'idx_users_is_active', 'is_active');
        $createIfNotExists('users', 'idx_users_clinic_id', 'clinic_id');

        // Appointments — date range and status filtering
        if (Schema::hasTable('appointments')) {
            $createIfNotExists('appointments', 'idx_appointments_date', 'appointment_date');
            $createIfNotExists('appointments', 'idx_appointments_status', 'status');
            $createIfNotExists('appointments', 'idx_appointments_doctor_date', 'doctor_id, appointment_date');
            $createIfNotExists('appointments', 'idx_appointments_patient_status', 'patient_id, status');
        }

        // Personal access tokens — fast token lookup
        if (Schema::hasTable('personal_access_tokens')) {
            $createIfNotExists('personal_access_tokens', 'idx_pat_tokenable', 'tokenable_type, tokenable_id');
        }
    }

    public function down(): void
    {
        $dropIfExists = function (string $table, string $indexName) {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'pgsql' || $driver === 'sqlite') {
                DB::statement("DROP INDEX IF EXISTS {$indexName}");
            } else {
                DB::statement("DROP INDEX {$indexName} ON {$table}");
            }
        };

        $dropIfExists('users', 'idx_users_email');
        $dropIfExists('users', 'idx_users_mobile');
        $dropIfExists('users', 'idx_users_role_id');
        $dropIfExists('users', 'idx_users_is_active');
        $dropIfExists('users', 'idx_users_clinic_id');

        if (Schema::hasTable('appointments')) {
            $dropIfExists('appointments', 'idx_appointments_date');
            $dropIfExists('appointments', 'idx_appointments_status');
            $dropIfExists('appointments', 'idx_appointments_doctor_date');
            $dropIfExists('appointments', 'idx_appointments_patient_status');
        }
    }
};
