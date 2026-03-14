<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * MedStream modernization:
     *
     * 1. Posts   → hospital_id FK (Hospital role can publish)
     * 2. Reports → admin_notes, resolved_by, resolved_at (full moderation flow)
     * 3. Posts   → view_count for analytics
     * 4. Bookmarks → add 'hospital' to bookmarked_type enum
     */
    public function up(): void
    {
        // ── 1. Posts: hospital_id + view_count ──
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->uuid('hospital_id')->nullable()->after('clinic_id')->index();
            $table->unsignedInteger('view_count')->default(0)->after('media_processing');

            $table->foreign('hospital_id')
                  ->references('id')->on('hospitals')
                  ->nullOnDelete();
        });

        // ── 2. Reports: full moderation fields ──
        Schema::table('med_stream_reports', function (Blueprint $table) {
            $table->text('admin_notes')->nullable()->after('admin_status');
            $table->uuid('resolved_by')->nullable()->after('admin_notes');
            $table->timestamp('resolved_at')->nullable()->after('resolved_by');

            $table->foreign('resolved_by')
                  ->references('id')->on('users')
                  ->nullOnDelete();
        });

        // ── 3. Bookmarks: expand bookmarked_type to include 'hospital' ──
        $driver = \DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            \DB::statement("ALTER TABLE med_stream_bookmarks DROP CONSTRAINT IF EXISTS med_stream_bookmarks_bookmarked_type_check");
            \DB::statement("ALTER TABLE med_stream_bookmarks ADD CONSTRAINT med_stream_bookmarks_bookmarked_type_check CHECK (bookmarked_type::text = ANY (ARRAY['post','doctor','clinic','patient','hospital']))");
        } elseif ($driver === 'mysql') {
            \DB::statement("ALTER TABLE med_stream_bookmarks MODIFY COLUMN bookmarked_type ENUM('post','doctor','clinic','patient','hospital')");
        }
    }

    public function down(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->dropColumn(['hospital_id', 'view_count']);
        });

        Schema::table('med_stream_reports', function (Blueprint $table) {
            $table->dropForeign(['resolved_by']);
            $table->dropColumn(['admin_notes', 'resolved_by', 'resolved_at']);
        });

        $driver = \DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            \DB::statement("ALTER TABLE med_stream_bookmarks DROP CONSTRAINT IF EXISTS med_stream_bookmarks_bookmarked_type_check");
            \DB::statement("ALTER TABLE med_stream_bookmarks ADD CONSTRAINT med_stream_bookmarks_bookmarked_type_check CHECK (bookmarked_type::text = ANY (ARRAY['post','doctor','clinic','patient']))");
        } elseif ($driver === 'mysql') {
            \DB::statement("ALTER TABLE med_stream_bookmarks MODIFY COLUMN bookmarked_type ENUM('post','doctor','clinic','patient')");
        }
    }
};
