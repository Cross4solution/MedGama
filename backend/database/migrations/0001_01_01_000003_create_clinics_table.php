<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('clinics')) {
            Schema::create('clinics', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('codename')->unique();
                $table->string('fullname');
                $table->string('avatar')->nullable();
                $table->uuid('owner_id')->nullable()->index();
                $table->string('address')->nullable();
                $table->text('biography')->nullable();
                $table->json('map_coordinates')->nullable(); // {lat, lng}
                $table->string('website')->nullable();
                $table->boolean('is_verified')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('owner_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        // Add foreign key from users.clinic_id -> clinics.id (if clinic_id exists and FK not yet added)
        if (Schema::hasColumn('users', 'clinic_id')) {
            // Try to add FK; if it already exists, migration will fail but that's OK (idempotent)
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
                });
            } catch (\Exception $e) {
                // FK probably already exists, skip
                if (strpos($e->getMessage(), 'already exists') === false &&
                    strpos($e->getMessage(), 'Duplicate') === false) {
                    throw $e;
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['clinic_id']);
        });
        Schema::dropIfExists('clinics');
    }
};
