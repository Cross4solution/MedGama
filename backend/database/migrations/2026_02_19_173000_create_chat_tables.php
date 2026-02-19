<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_one_id')->index();
            $table->uuid('user_two_id')->index();
            $table->timestamp('last_message_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('user_one_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('user_two_id')->references('id')->on('users')->cascadeOnDelete();

            // Prevent duplicate conversations between the same two users
            $table->unique(['user_one_id', 'user_two_id']);
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id')->index();
            $table->uuid('sender_id')->index();
            $table->enum('message_type', ['text', 'image', 'document'])->default('text');
            $table->text('content')->nullable();
            $table->string('attachment_url')->nullable();
            $table->string('attachment_name')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('conversation_id')->references('id')->on('chat_conversations')->cascadeOnDelete();
            $table->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }
};
