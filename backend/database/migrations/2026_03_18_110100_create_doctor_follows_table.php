<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('doctor_follows')) return;

        Schema::create('doctor_follows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('follower_id');
            $table->uuid('following_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('follower_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('following_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['follower_id', 'following_id']);
            $table->index(['following_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_follows');
    }
};
