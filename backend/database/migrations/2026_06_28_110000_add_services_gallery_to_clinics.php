<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            // TiDB: JSON nullable, no default
            if (!Schema::hasColumn('clinics', 'services')) {
                $table->json('services')->nullable()->after('packages');
            }
            if (!Schema::hasColumn('clinics', 'gallery')) {
                $table->json('gallery')->nullable()->after('services');
            }
        });
    }

    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['services', 'gallery']);
        });
    }
};
