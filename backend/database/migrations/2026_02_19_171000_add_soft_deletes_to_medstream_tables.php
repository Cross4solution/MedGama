<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('med_stream_comments', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('med_stream_comments', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
