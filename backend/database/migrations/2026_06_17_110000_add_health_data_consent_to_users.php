<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * KVKK Md. 6 / GDPR Art. 9 — Sağlık verisi açık rıza kaydı.
 *
 * Hasta kaydı sırasında "sağlık verilerimin işlenmesine açık rıza veriyorum"
 * onayı alınır ve burada kim/ne zaman bilgisi tutulur:
 *   • health_data_consent_at → açık rızanın verildiği an (NULL = rıza yok)
 *   • health_data_consent_ip → rızanın alındığı IP (ispat amaçlı)
 *
 * TiDB uyumlu: nullable timestamp + nullable varchar, default yok.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'health_data_consent_at')) {
                $table->timestamp('health_data_consent_at')
                    ->nullable()
                    ->after('guardian_consent_at');
            }

            if (!Schema::hasColumn('users', 'health_data_consent_ip')) {
                $table->string('health_data_consent_ip', 45) // IPv6 uyumlu uzunluk
                    ->nullable()
                    ->after('health_data_consent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'health_data_consent_ip')) {
                $table->dropColumn('health_data_consent_ip');
            }
            if (Schema::hasColumn('users', 'health_data_consent_at')) {
                $table->dropColumn('health_data_consent_at');
            }
        });
    }
};
