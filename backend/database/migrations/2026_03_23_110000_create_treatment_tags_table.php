<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('specialty_id');
            $table->foreign('specialty_id')->references('id')->on('specialties')->cascadeOnDelete();

            $table->string('slug', 100)->unique();        // e.g. "botox", "laser-epilation"
            $table->jsonb('name');                          // {"en": "Botox", "tr": "Botoks"}
            $table->jsonb('aliases')->nullable();           // {"en": ["wrinkle treatment","botulinum"], "tr": ["kırışıklık tedavisi","botulinum"]}
            $table->jsonb('description')->nullable();       // {"en": "...", "tr": "..."}
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->index('specialty_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_tags');
    }
};
