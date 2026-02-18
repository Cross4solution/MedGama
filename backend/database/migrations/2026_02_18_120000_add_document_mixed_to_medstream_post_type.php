<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Expand post_type enum to include 'document' and 'mixed'
        DB::statement("ALTER TABLE med_stream_posts MODIFY COLUMN post_type ENUM('text','image','video','document','mixed') DEFAULT 'text'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE med_stream_posts MODIFY COLUMN post_type ENUM('text','image','video') DEFAULT 'text'");
    }
};
