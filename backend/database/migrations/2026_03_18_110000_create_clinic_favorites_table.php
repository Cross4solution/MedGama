<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_favorites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('clinic_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'clinic_id']);
            $table->index('user_id');
            $table->index('clinic_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_favorites');
    }
};
