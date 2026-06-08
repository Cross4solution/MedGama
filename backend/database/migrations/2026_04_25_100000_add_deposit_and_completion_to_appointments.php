<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Onaylı Review Sistemi — Migration
 * appointments tablosuna deposit_status ve auto_completed_at alanlarını ekler.
 * - deposit_status: kapora ödeme placeholder (şimdilik kullanılmıyor, default 'skipped')
 * - auto_completed_at: cron tarafından doldurulan otomatik tamamlanma zaman damgası
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Kapora ödeme durumu — ENUM, TiDB uyumlu (default 'skipped')
            if (!Schema::hasColumn('appointments', 'deposit_status')) {
                $table->enum('deposit_status', ['pending', 'paid', 'skipped', 'refunded'])
                    ->default('skipped')
                    ->nullable()
                    ->after('status');
            }

            // Cron tarafından doldurulan otomatik tamamlanma zaman damgası
            if (!Schema::hasColumn('appointments', 'auto_completed_at')) {
                $table->timestamp('auto_completed_at')
                    ->nullable()
                    ->after('deposit_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'auto_completed_at')) {
                $table->dropColumn('auto_completed_at');
            }
            if (Schema::hasColumn('appointments', 'deposit_status')) {
                $table->dropColumn('deposit_status');
            }
        });
    }
};
