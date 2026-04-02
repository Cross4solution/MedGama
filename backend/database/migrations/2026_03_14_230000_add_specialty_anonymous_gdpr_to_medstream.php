<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bölüm 5 — MedStream enhancements:
     *
     * 1. specialty       → Uzmanlık alanı etiketi (FK → specialties)
     * 2. is_anonymous    → Anonim paylaşım bayrağı
     * 3. gdpr_consent    → KVKK/GDPR hasta verisi paylaşılmadığını onay bayrağı
     * 4. doctor_follows  → Takip sistemi tablosu (feed algoritması için)
     */
    public function up(): void
    {
        // ── 1. Posts: specialty + is_anonymous + gdpr_consent ──
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->uuid('specialty_id')->nullable()->after('hospital_id')->index();
            $table->boolean('is_anonymous')->default(false)->after('is_hidden');
            $table->boolean('gdpr_consent')->default(false)->after('is_anonymous');

            $table->foreign('specialty_id')
                  ->references('id')->on('specialties')
                  ->nullOnDelete();
        });

        // ── 2. Doctor Follows (feed algoritması) ──
        if (!Schema::hasTable('doctor_follows')) {
            Schema::create('doctor_follows', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('follower_id')->index();
                $table->uuid('following_id')->index();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('follower_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('following_id')->references('id')->on('users')->cascadeOnDelete();
                $table->unique(['follower_id', 'following_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_follows');

        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropForeign(['specialty_id']);
            $table->dropColumn(['specialty_id', 'is_anonymous', 'gdpr_consent']);
        });
    }
};
