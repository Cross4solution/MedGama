<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: drop old check constraint and add new one with document & mixed
            DB::statement("ALTER TABLE med_stream_posts DROP CONSTRAINT IF EXISTS med_stream_posts_post_type_check");
            DB::statement("ALTER TABLE med_stream_posts ADD CONSTRAINT med_stream_posts_post_type_check CHECK (post_type::text = ANY (ARRAY['text','image','video','document','mixed']))");
        } elseif ($driver === 'mysql') {
            // MySQL: modify enum column
            DB::statement("ALTER TABLE med_stream_posts MODIFY COLUMN post_type ENUM('text','image','video','document','mixed') DEFAULT 'text'");
        }
        // SQLite: no-op (column is already a string type, no enum constraint)
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE med_stream_posts DROP CONSTRAINT IF EXISTS med_stream_posts_post_type_check");
            DB::statement("ALTER TABLE med_stream_posts ADD CONSTRAINT med_stream_posts_post_type_check CHECK (post_type::text = ANY (ARRAY['text','image','video']))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE med_stream_posts MODIFY COLUMN post_type ENUM('text','image','video') DEFAULT 'text'");
        }
        // SQLite: no-op
    }
};
