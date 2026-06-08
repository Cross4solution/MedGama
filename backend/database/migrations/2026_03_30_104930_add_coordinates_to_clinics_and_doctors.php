<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add latitude and longitude to clinics table
        Schema::table('clinics', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('map_coordinates');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });

        // Add latitude and longitude to doctor_profiles table
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('map_coordinates');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });

        // Migrate existing map_coordinates JSON to separate columns
        DB::statement("
            UPDATE clinics 
            SET latitude = CAST(map_coordinates->>'lat' AS DECIMAL(10,7)),
                longitude = CAST(map_coordinates->>'lng' AS DECIMAL(10,7))
            WHERE map_coordinates IS NOT NULL
        ");

        DB::statement("
            UPDATE doctor_profiles 
            SET latitude = CAST(map_coordinates->>'lat' AS DECIMAL(10,7)),
                longitude = CAST(map_coordinates->>'lng' AS DECIMAL(10,7))
            WHERE map_coordinates IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });

        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
