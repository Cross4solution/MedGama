<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->jsonb('media')->nullable()->after('media_url');
        });
    }

    public function down(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropColumn('media');
        });
    }
};
