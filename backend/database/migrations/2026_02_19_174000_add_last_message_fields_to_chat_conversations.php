<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->string('last_message_content', 255)->nullable()->after('last_message_at');
            $table->string('last_message_type', 20)->nullable()->after('last_message_content');
            $table->uuid('last_message_sender_id')->nullable()->after('last_message_type');
        });
    }

    public function down(): void
    {
        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->dropColumn(['last_message_content', 'last_message_type', 'last_message_sender_id']);
        });
    }
};
