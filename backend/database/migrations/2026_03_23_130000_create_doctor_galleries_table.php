<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_galleries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('image_path');
            $table->string('thumb_path')->nullable();
            $table->string('original_name')->nullable();
            $table->unsignedInteger('file_size')->default(0);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_galleries');
    }
};
