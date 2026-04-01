<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Utils\SlugGenerator;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Backfill slugs for all existing doctor profiles that don't have one.
     * Turkish character support: Uzm. Dr. Ayşe Kaya → uzm-dr-ayse-kaya
     */
    public function up(): void
    {
        $profiles = DB::table('doctor_profiles')
            ->whereNull('slug')
            ->orWhere('slug', '')
            ->get(['id', 'user_id', 'title']);

        foreach ($profiles as $profile) {
            $user = DB::table('users')
                ->where('id', $profile->user_id)
                ->value('fullname');

            if (!$user) continue;

            $baseSlug = SlugGenerator::generateDoctorSlug($profile->title ?? '', $user);

            // Ensure unique slug
            $slug = SlugGenerator::ensureUniqueSlug($baseSlug, function ($check) use ($profile) {
                return DB::table('doctor_profiles')
                    ->where('slug', $check)
                    ->where('id', '!=', $profile->id)
                    ->exists();
            });

            DB::table('doctor_profiles')
                ->where('id', $profile->id)
                ->update(['slug' => $slug]);
        }
    }

    public function down(): void
    {
        // No rollback needed — slugs can be regenerated
    }
};
