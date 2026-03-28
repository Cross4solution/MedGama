<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Clean up garbage/test reviews with nonsensical comments.
     * Removes reviews where comment is under 10 chars or matches known garbage patterns.
     *
     * PostgreSQL: uses ~ regex operator
     * MySQL/TiDB: uses REGEXP operator (same syntax, different keyword)
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        DB::table('doctor_reviews')
            ->where(function ($q) use ($driver) {
                $q->whereRaw("LENGTH(COALESCE(comment, '')) > 0 AND LENGTH(comment) < 10");

                if ($driver === 'pgsql') {
                    $q->orWhereRaw("LOWER(comment) ~ '^[a-z]{1,6}$'")       // e.g. "asdasd"
                      ->orWhereRaw("comment ~ '^[A-Z]{3,}$'")               // e.g. "ASDSAD"
                      ->orWhereRaw("LOWER(comment) ~ '^(test|asdf|qwer|asd)'");
                } else {
                    // MySQL / TiDB / SQLite use REGEXP
                    $q->orWhereRaw("LOWER(comment) REGEXP '^[a-z]{1,6}$'")  // e.g. "asdasd"
                      ->orWhereRaw("comment REGEXP '^[A-Z]{3,}$'")          // e.g. "ASDSAD"
                      ->orWhereRaw("LOWER(comment) REGEXP '^(test|asdf|qwer|asd)'");
                }
            })
            ->delete();
    }

    public function down(): void
    {
        // Cannot restore deleted reviews
    }
};
