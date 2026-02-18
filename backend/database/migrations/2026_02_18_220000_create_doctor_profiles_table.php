<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            // Basic professional info
            $table->string('title')->nullable();           // e.g. "Kardiyoloji Uzmanı"
            $table->string('specialty')->nullable();        // Primary specialty
            $table->json('sub_specialties')->nullable();    // Additional specialties array
            $table->text('bio')->nullable();                // About / biography
            $table->string('experience_years')->nullable(); // e.g. "15+"
            $table->string('license_number')->nullable();   // Medical license

            // Education & training
            $table->json('education')->nullable();          // [{degree, school, year}]
            $table->json('certifications')->nullable();     // [{name, issuer, year}]

            // Services & pricing
            $table->json('services')->nullable();           // [{name, description, icon?}]
            $table->json('prices')->nullable();             // [{label, min, max, currency}]

            // Languages spoken
            $table->json('languages')->nullable();          // ["Turkish", "English", "German"]

            // Location & contact
            $table->string('address')->nullable();
            $table->json('map_coordinates')->nullable();    // {lat, lng}
            $table->string('phone')->nullable();
            $table->string('website')->nullable();

            // Gallery
            $table->json('gallery')->nullable();            // [url1, url2, ...]

            // Settings
            $table->boolean('online_consultation')->default(false);
            $table->boolean('accepts_insurance')->default(false);
            $table->json('insurance_providers')->nullable(); // ["SGK", "Allianz", ...]

            // Onboarding
            $table->boolean('onboarding_completed')->default(false);
            $table->integer('onboarding_step')->default(0); // Track which step they're on

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_profiles');
    }
};
