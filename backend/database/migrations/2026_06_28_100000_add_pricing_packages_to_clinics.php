<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            // TiDB: JSON nullable, no ->default('') (TEXT/JSON default yasak)
            if (!Schema::hasColumn('clinics', 'price_ranges')) {
                $table->json('price_ranges')->nullable()->after('website');
            }
            if (!Schema::hasColumn('clinics', 'packages')) {
                $table->json('packages')->nullable()->after('price_ranges');
            }
        });
    }

    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['price_ranges', 'packages']);
        });
    }
};
