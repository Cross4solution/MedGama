<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key', 100)->unique();
            $table->text('value')->default('');
            $table->string('type', 20)->default('boolean'); // boolean, string, integer, json
            $table->string('group', 50)->default('general');
            $table->string('label', 255)->default('');
            $table->text('description')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
