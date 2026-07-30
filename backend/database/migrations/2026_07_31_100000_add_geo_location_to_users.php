<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MedStream konum akışı: kullanıcının son bilinen konumu.
 *   • country (var) + state → cookie girişte "ülke/eyalet değişti mi" karşılaştırması
 *   • latitude/longitude → yakındaki-klinik (bbox) filtresi
 *   • location_updated_at → tazelik
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'state')) {
                $table->string('state', 100)->nullable()->after('country');
            }
            if (!Schema::hasColumn('users', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('state');
            }
            if (!Schema::hasColumn('users', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('users', 'location_updated_at')) {
                $table->timestamp('location_updated_at')->nullable()->after('longitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['state', 'latitude', 'longitude', 'location_updated_at'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
