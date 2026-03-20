<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('clinic_id');
            $table->uuid('patient_id');
            $table->uuid('appointment_id')->nullable();
            $table->tinyInteger('rating')->unsigned(); // 1-5
            $table->text('comment')->nullable();
            $table->string('treatment_type')->nullable();

            // Clinic owner / manager response
            $table->text('clinic_response')->nullable();
            $table->timestamp('clinic_response_at')->nullable();

            $table->boolean('is_verified')->default(false);
            $table->boolean('is_visible')->default(true);

            // Moderation
            $table->string('moderation_status')->default('pending');
            $table->uuid('moderated_by')->nullable();
            $table->timestamp('moderated_at')->nullable();
            $table->text('moderation_note')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('clinic_id')->references('id')->on('clinics')->cascadeOnDelete();
            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('appointment_id')->references('id')->on('appointments')->nullOnDelete();
            $table->foreign('moderated_by')->references('id')->on('users')->nullOnDelete();

            // One review per patient per clinic
            $table->unique(['clinic_id', 'patient_id']);
            $table->index(['clinic_id', 'is_visible', 'rating']);
            $table->index('moderation_status');
        });

        // Aggregated rating columns on clinics for fast reads
        Schema::table('clinics', function (Blueprint $table) {
            $table->decimal('avg_rating', 2, 1)->nullable()->after('is_verified');
            $table->unsignedInteger('review_count')->default(0)->after('avg_rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_reviews');

        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['avg_rating', 'review_count']);
        });
    }
};
