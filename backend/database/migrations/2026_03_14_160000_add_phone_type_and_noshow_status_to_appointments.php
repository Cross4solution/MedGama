<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add 'phone' appointment_type and 'no_show' status to appointments table.
     * PostgreSQL ALTER TYPE ... ADD VALUE is used for enum columns.
     */
    public function up(): void
    {
        // Add 'phone' to appointment_type enum
        DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_type_check");
        DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_type_check CHECK (appointment_type IN ('inPerson', 'online', 'phone'))");

        // Add 'no_show' to status enum
        DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
        DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_type_check");
        DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_type_check CHECK (appointment_type IN ('inPerson', 'online'))");

        DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
        DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))");
    }
};
