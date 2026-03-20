<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Clean up garbage/test reviews with nonsensical comments.
     * Removes reviews where comment is under 10 chars or matches known garbage patterns.
     */
    public function up(): void
    {
        // Delete reviews with very short or obviously garbage comments
        DB::table('doctor_reviews')
            ->where(function ($q) {
                $q->whereRaw("LENGTH(COALESCE(comment, '')) > 0 AND LENGTH(comment) < 10")
                  ->orWhereRaw("LOWER(comment) ~ '^[a-z]{1,6}$'")           // e.g. "asdasd", "engss"
                  ->orWhereRaw("comment ~ '^[A-Z]{3,}$'")                   // e.g. "ASDSAD"
                  ->orWhereRaw("LOWER(comment) ~ '^(test|asdf|qwer|asd)'"); // common test patterns
            })
            ->delete();
    }

    public function down(): void
    {
        // Cannot restore deleted reviews
    }
};
