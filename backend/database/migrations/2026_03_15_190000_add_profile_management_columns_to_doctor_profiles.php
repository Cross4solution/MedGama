<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            // Operating hours: [{day: 'monday', open: '09:00', close: '18:00', breaks: [{start:'12:00',end:'13:00'}], is_closed: false}]
            $table->json('operating_hours')->nullable()->after('gallery');

            // Social & contact links
            $table->string('whatsapp', 50)->nullable()->after('website');
            $table->json('social_links')->nullable()->after('whatsapp'); // {instagram, facebook, twitter, linkedin, youtube, tiktok}

            // Enhanced services: [{name, description, duration_minutes, price, currency}]
            // (reuses existing 'services' JSON column — no new column needed)

            // Gallery ordering: already stored as JSON array — order = array index
        });
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropColumn(['operating_hours', 'whatsapp', 'social_links']);
        });
    }
};
