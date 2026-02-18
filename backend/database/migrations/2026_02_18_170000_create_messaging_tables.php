<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Conversations — A thread between two or more participants
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title')->nullable();                          // Optional group name
            $table->enum('type', ['direct', 'group'])->default('direct'); // DM or group chat
            $table->uuid('clinic_id')->nullable()->index();               // Scope to clinic if needed
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
        });

        // Conversation Participants — Who is in each conversation
        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id')->index();
            $table->uuid('user_id')->index();
            $table->enum('role', ['member', 'admin'])->default('member'); // Group admin
            $table->timestamp('last_read_at')->nullable();                // For unread count
            $table->boolean('is_muted')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['conversation_id', 'user_id']);
        });

        // Messages — Individual messages within a conversation
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id')->index();
            $table->uuid('sender_id')->index();
            $table->uuid('reply_to_id')->nullable()->index();            // Reply threading
            $table->text('body')->nullable();                             // Message text (nullable for attachment-only)
            $table->enum('type', ['text', 'image', 'file', 'video', 'audio', 'system'])->default('text');
            $table->json('metadata')->nullable();                         // Flexible extra data
            $table->boolean('is_edited')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();                                        // Soft delete for "delete for me"

            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();
            $table->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // Self-referencing FK must be added after table exists (PostgreSQL requirement)
        Schema::table('messages', function (Blueprint $table) {
            $table->foreign('reply_to_id')->references('id')->on('messages')->nullOnDelete();
        });

        // Message Attachments — Files/images attached to messages
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('message_id')->index();
            $table->string('file_name');                                  // Original file name
            $table->string('file_path');                                  // Storage path
            $table->string('file_type');                                  // MIME type
            $table->unsignedBigInteger('file_size')->default(0);          // Bytes
            $table->string('thumb_path')->nullable();                     // Thumbnail for images
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('message_id')->references('id')->on('messages')->cascadeOnDelete();
        });

        // Message Read Receipts — Per-message read tracking
        Schema::create('message_read_receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('message_id')->index();
            $table->uuid('user_id')->index();
            $table->timestamp('read_at');
            $table->timestamps();

            $table->foreign('message_id')->references('id')->on('messages')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['message_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_read_receipts');
        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};
