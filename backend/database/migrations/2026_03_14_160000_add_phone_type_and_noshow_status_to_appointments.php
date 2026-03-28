<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add 'phone' to appointment_type enum and 'no_show' to status enum.
     *
     * PostgreSQL: DROP + ADD CHECK constraint (no ALTER TYPE needed for plain CHECK).
     * MySQL/TiDB: MODIFY COLUMN to redefine the ENUM values.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_type_check");
            DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_type_check CHECK (appointment_type IN ('inPerson', 'online', 'phone'))");

            DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
            DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE appointments MODIFY COLUMN appointment_type ENUM('inPerson','online','phone') NOT NULL DEFAULT 'inPerson'");
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending'");
        }
        // SQLite: column is a plain string — no constraint to update
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_type_check");
            DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_type_check CHECK (appointment_type IN ('inPerson', 'online'))");

            DB::statement("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check");
            DB::statement("ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE appointments MODIFY COLUMN appointment_type ENUM('inPerson','online') NOT NULL DEFAULT 'inPerson'");
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending'");
        }
    }
};
