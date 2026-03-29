<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->boolean('onboarding_completed')->default(false)->after('is_active');
            $table->tinyInteger('onboarding_step')->default(0)->after('onboarding_completed');
            $table->string('phone', 30)->nullable()->after('address');
            $table->json('specialties')->nullable()->after('biography');
        });
    }

    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['onboarding_completed', 'onboarding_step', 'phone', 'specialties']);
        });
    }
};
