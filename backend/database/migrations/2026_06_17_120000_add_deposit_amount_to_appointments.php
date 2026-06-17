<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kapora (deposit) altyapısı — ÖDEMESİZ.
 * appointments tablosuna deposit_amount alanını ekler (tutar kaydı).
 *
 * NOT: Gerçek tahsilat YOK. Bu alan yalnızca kapora tutarının kaydı içindir.
 * İleride payment gateway entegrasyonu deposit_status='paid' yapacaktır.
 *
 * TiDB uyumluluğu:
 *  - decimal nullable (TEXT/JSON değil, ->default('') yok)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Kapora tutarı — nullable decimal (örn. 250.00 TL). null = kapora yok.
            if (!Schema::hasColumn('appointments', 'deposit_amount')) {
                $table->decimal('deposit_amount', 10, 2)
                    ->nullable()
                    ->after('deposit_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'deposit_amount')) {
                $table->dropColumn('deposit_amount');
            }
        });
    }
};
