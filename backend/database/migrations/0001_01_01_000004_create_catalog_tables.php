<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Specialties — Medical specialties with i18n translations
        Schema::create('specialties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique(); // CARD, ENDO, DERM...
            $table->integer('display_order')->default(100);
            $table->json('translations'); // {"en":"Cardiology","tr":"Kardiyoloji"}
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('display_order');
        });

        // Cities — with country reference and i18n
        Schema::create('cities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code'); // IST, ANK, NYC...
            $table->integer('country_id');
            $table->json('translations'); // {"en":"Istanbul","tr":"İstanbul"}
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('code');
            $table->index('country_id');
            $table->unique(['country_id', 'code']);
        });

        // Disease/Conditions — with i18n and specialty recommendations
        Schema::create('disease_conditions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique(); // DIAB, ASTHMA...
            $table->json('recommended_specialty_ids')->nullable(); // array of specialty UUIDs
            $table->json('translations'); // {"en":"Diabetes","tr":"Diyabet"}
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Symptom-Specialty Mapping — powers search suggestions
        Schema::create('symptom_specialty_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('symptom')->unique(); // cough, rash, headache...
            $table->json('specialty_ids'); // array of specialty UUIDs
            $table->json('translations'); // {"en":"Cough","tr":"Öksürük"}
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('symptom');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('symptom_specialty_mappings');
        Schema::dropIfExists('disease_conditions');
        Schema::dropIfExists('cities');
        Schema::dropIfExists('specialties');
    }
};
