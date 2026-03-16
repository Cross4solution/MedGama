<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_reviews', function (Blueprint $table) {
            // Treatment type (Doc §10)
            $table->string('treatment_type')->nullable()->after('comment');

            // Doctor professional response
            $table->text('doctor_response')->nullable()->after('treatment_type');
            $table->timestamp('doctor_response_at')->nullable()->after('doctor_response');

            // Moderation (pending → approved / rejected / hidden)
            $table->string('moderation_status')->default('pending')->after('is_visible');
            $table->uuid('moderated_by')->nullable()->after('moderation_status');
            $table->timestamp('moderated_at')->nullable()->after('moderated_by');
            $table->text('moderation_note')->nullable()->after('moderated_at');

            $table->foreign('moderated_by')->references('id')->on('users')->nullOnDelete();
            $table->index('moderation_status');
        });

        // Aggregated rating columns on doctor_profiles for fast reads
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->decimal('avg_rating', 2, 1)->nullable()->after('onboarding_step');
            $table->unsignedInteger('review_count')->default(0)->after('avg_rating');
        });
    }

    public function down(): void
    {
        Schema::table('doctor_reviews', function (Blueprint $table) {
            $table->dropForeign(['moderated_by']);
            $table->dropIndex(['moderation_status']);
            $table->dropColumn([
                'treatment_type', 'doctor_response', 'doctor_response_at',
                'moderation_status', 'moderated_by', 'moderated_at', 'moderation_note',
            ]);
        });

        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropColumn(['avg_rating', 'review_count']);
        });
    }
};
