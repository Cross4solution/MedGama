<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('language_catalog', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 10)->unique();       // ISO 639-1: en, tr, de, ar …
            $table->json('name');                       // {"en": "Turkish", "tr": "Türkçe"}
            $table->string('native_name', 100);          // Türkçe, العربية, Deutsch …
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('language_catalog');
    }
};
