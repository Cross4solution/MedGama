<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_faqs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('doctor_id');
            $table->string('question', 500);
            $table->text('answer');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('doctor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['doctor_id', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_faqs');
    }
};
