<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disease_conditions', function (Blueprint $table) {
            $table->boolean('is_popular')->default(false)->after('is_active');
        });

        Schema::table('allergies', function (Blueprint $table) {
            $table->boolean('is_popular')->default(false)->after('is_active');
        });

        Schema::table('medications', function (Blueprint $table) {
            $table->boolean('is_popular')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('disease_conditions', function (Blueprint $table) {
            $table->dropColumn('is_popular');
        });

        Schema::table('allergies', function (Blueprint $table) {
            $table->dropColumn('is_popular');
        });

        Schema::table('medications', function (Blueprint $table) {
            $table->dropColumn('is_popular');
        });
    }
};
