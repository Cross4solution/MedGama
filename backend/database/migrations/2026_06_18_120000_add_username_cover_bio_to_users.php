<?php

use App\Models\User;
use App\Support\Username;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // varchar + unique (TiDB/MySQL safe — no TEXT in unique index)
            $table->string('username', 50)->nullable()->unique()->after('fullname');
            $table->string('cover_image')->nullable()->after('avatar');
            $table->text('bio')->nullable()->after('cover_image');
        });

        // Backfill handles for existing accounts (oldest first → stable handles)
        User::whereNull('username')->orderBy('created_at')->chunkById(200, function ($users) {
            foreach ($users as $u) {
                $u->username = Username::generate(
                    $u->fullname ?? 'user',
                    $u->role_id ?? 'patient',
                    $u->clinic_name,
                    $u->id,
                );
                $u->saveQuietly();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn(['username', 'cover_image', 'bio']);
        });
    }
};
