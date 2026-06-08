<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('favoritable_id');
            $table->string('favoritable_type', 50); // 'doctor' or 'clinic'
            $table->timestamps();

            $table->unique(['user_id', 'favoritable_id', 'favoritable_type'], 'favorites_unique');
            $table->index('user_id');
            $table->index(['favoritable_id', 'favoritable_type']);
        });

// Migrate existing clinic_favorites data (driver-aware)
        if (Schema::hasTable('clinic_favorites')) {
            $driver = DB::connection()->getDriverName();
            if ($driver === 'mysql') {
                DB::statement("
                    INSERT IGNORE INTO favorites (id, user_id, favoritable_id, favoritable_type, created_at, updated_at)
                    SELECT id, user_id, clinic_id, 'clinic', created_at, updated_at
                    FROM clinic_favorites
                ");
            } elseif ($driver === 'sqlite') {
                DB::statement("
                    INSERT OR IGNORE INTO favorites (id, user_id, favoritable_id, favoritable_type, created_at, updated_at)
                    SELECT id, user_id, clinic_id, 'clinic', created_at, updated_at
                    FROM clinic_favorites
                ");
            } else {
                DB::statement("
                    INSERT INTO favorites (id, user_id, favoritable_id, favoritable_type, created_at, updated_at)
                    SELECT id, user_id, clinic_id, 'clinic', created_at, updated_at
                    FROM clinic_favorites
                    ON CONFLICT DO NOTHING
                ");
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
