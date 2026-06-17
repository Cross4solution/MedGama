<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Otomatik Randevu Hatırlatma — Migration
 * appointments tablosuna hatırlatma gönderim zaman damgalarını ekler.
 * Bu alanlar çift gönderimi (24h / 1h) önlemek için kullanılır.
 *
 * TiDB uyumlu: nullable timestamp, default yok.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // 24 saat önce hatırlatma gönderildi flag'i
            if (!Schema::hasColumn('appointments', 'reminder_24h_sent_at')) {
                $table->timestamp('reminder_24h_sent_at')
                    ->nullable()
                    ->after('auto_completed_at');
            }

            // 1 saat önce hatırlatma gönderildi flag'i
            if (!Schema::hasColumn('appointments', 'reminder_1h_sent_at')) {
                $table->timestamp('reminder_1h_sent_at')
                    ->nullable()
                    ->after('reminder_24h_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'reminder_1h_sent_at')) {
                $table->dropColumn('reminder_1h_sent_at');
            }
            if (Schema::hasColumn('appointments', 'reminder_24h_sent_at')) {
                $table->dropColumn('reminder_24h_sent_at');
            }
        });
    }
};
