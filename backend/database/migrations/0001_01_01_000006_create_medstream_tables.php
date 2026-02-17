<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // MedStream Posts — Professional feed content
        Schema::create('med_stream_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('author_id')->index();
            $table->uuid('clinic_id')->nullable()->index();
            $table->enum('post_type', ['text', 'image', 'video'])->default('text');
            $table->text('content')->nullable();
            $table->string('media_url')->nullable(); // External URL only
            $table->boolean('is_hidden')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
        });

        // MedStream Comments
        Schema::create('med_stream_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->index();
            $table->uuid('author_id')->index();
            $table->text('content');
            $table->boolean('is_hidden')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('med_stream_posts')->nullOnDelete();
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['post_id', 'author_id', 'content']); // Prevent duplicate comments
        });

        // MedStream Likes — One per user per post
        Schema::create('med_stream_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->index();
            $table->uuid('user_id')->index();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('med_stream_posts')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['user_id', 'post_id']);
        });

        // MedStream Bookmarks — Favorites
        Schema::create('med_stream_bookmarks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->enum('bookmarked_type', ['post', 'doctor', 'clinic', 'patient']);
            $table->uuid('target_id')->index();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['user_id', 'bookmarked_type', 'target_id']);
        });

        // MedStream Reports — Content moderation
        Schema::create('med_stream_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->index();
            $table->uuid('reporter_id')->index();
            $table->string('reason');
            $table->enum('admin_status', ['pending', 'reviewed', 'hidden', 'deleted'])->default('pending');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('med_stream_posts')->nullOnDelete();
            $table->foreign('reporter_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['post_id', 'reporter_id']);
            $table->index('admin_status');
        });

        // MedStream Engagement Counters — Cached like/comment counts
        Schema::create('med_stream_engagement_counters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id')->unique();
            $table->integer('like_count')->default(0);
            $table->integer('comment_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('med_stream_posts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('med_stream_engagement_counters');
        Schema::dropIfExists('med_stream_reports');
        Schema::dropIfExists('med_stream_bookmarks');
        Schema::dropIfExists('med_stream_likes');
        Schema::dropIfExists('med_stream_comments');
        Schema::dropIfExists('med_stream_posts');
    }
};
