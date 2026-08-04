<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hastanelere koordinat. Klinik ve doktor profillerinde vardı; hastanelerde
 * olmadığı için hastane paylaşımları "yakınımdakiler" filtresinde hiç eşleşmiyordu.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            if (!Schema::hasColumn('hospitals', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('hospitals', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            foreach (['latitude', 'longitude'] as $col) {
                if (Schema::hasColumn('hospitals', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
