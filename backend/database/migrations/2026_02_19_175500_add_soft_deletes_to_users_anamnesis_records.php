<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('digital_anamneses', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('patient_records', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('digital_anamneses', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('patient_records', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
