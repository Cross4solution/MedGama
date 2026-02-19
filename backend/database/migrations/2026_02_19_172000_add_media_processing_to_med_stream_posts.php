<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->boolean('media_processing')->default(false)->after('is_hidden');
        });
    }

    public function down(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropColumn('media_processing');
        });
    }
};
