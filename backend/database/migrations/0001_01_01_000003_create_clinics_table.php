<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('codename')->unique();
            $table->string('fullname');
            $table->string('avatar')->nullable();
            $table->uuid('owner_id')->index();
            $table->string('address')->nullable();
            $table->text('biography')->nullable();
            $table->json('map_coordinates')->nullable(); // {lat, lng}
            $table->string('website')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('owner_id')->references('id')->on('users')->nullOnDelete();
        });

        // Add foreign key from users.clinic_id -> clinics.id
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['clinic_id']);
        });
        Schema::dropIfExists('clinics');
    }
};
