<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('meeting_id')->nullable()->after('video_conference_link');
            $table->string('meeting_url')->nullable()->after('meeting_id');
            $table->string('meeting_status', 30)->default('pending')
                ->after('meeting_url')
                ->comment('pending|created|in_progress|completed|failed');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['meeting_id', 'meeting_url', 'meeting_status']);
        });
    }
};
