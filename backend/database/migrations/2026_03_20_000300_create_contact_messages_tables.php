<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sender_id');
            $table->uuid('receiver_id');
            $table->string('receiver_type', 20); // 'clinic' or 'doctor'
            $table->string('subject', 255)->nullable();
            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['receiver_id', 'receiver_type', 'is_read']);
            $table->index(['sender_id', 'created_at']);
        });

        Schema::create('contact_message_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('contact_message_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamps();

            $table->foreign('contact_message_id')->references('id')->on('contact_messages')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_message_attachments');
        Schema::dropIfExists('contact_messages');
    }
};
