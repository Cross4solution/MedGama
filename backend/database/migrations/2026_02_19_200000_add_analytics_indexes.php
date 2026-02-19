<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Composite index for clinic summary queries (status + clinic_id + created_at)
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['clinic_id', 'status', 'created_at'], 'idx_appointments_clinic_status_created');
            $table->index(['doctor_id', 'status', 'created_at'], 'idx_appointments_doctor_status_created');
        });

        // MedStream posts: clinic_id + created_at for engagement aggregation
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->index(['clinic_id', 'created_at'], 'idx_medstream_posts_clinic_created');
            $table->index(['author_id', 'created_at'], 'idx_medstream_posts_author_created');
        });

        // Engagement counters: post_id already unique-indexed, add for join performance
        Schema::table('med_stream_engagement_counters', function (Blueprint $table) {
            $table->index(['post_id', 'like_count', 'comment_count'], 'idx_engagement_post_counts');
        });

        // Users: clinic_id + role_id for doctor listing within clinic
        Schema::table('users', function (Blueprint $table) {
            $table->index(['clinic_id', 'role_id', 'is_active'], 'idx_users_clinic_role_active');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appointments_clinic_status_created');
            $table->dropIndex('idx_appointments_doctor_status_created');
        });

        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropIndex('idx_medstream_posts_clinic_created');
            $table->dropIndex('idx_medstream_posts_author_created');
        });

        Schema::table('med_stream_engagement_counters', function (Blueprint $table) {
            $table->dropIndex('idx_engagement_post_counts');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_clinic_role_active');
        });
    }
};
