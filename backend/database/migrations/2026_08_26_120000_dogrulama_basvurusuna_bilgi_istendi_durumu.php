<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `verification_requests.status` sütunu `info_requested` değerini kabul etmiyordu.
 *
 * Yönetici panelinde dört doğrulama kararı var: onayla, reddet, geri al ve
 * BİLGİ İSTE ("belgeniz okunaksız, tekrar yükleyin"). Sonuncusu koda
 * `status = 'info_requested'` yazıyor, ama sütun
 * `enum('pending','approved','rejected')` olarak tanımlıydı.
 *
 * Sonuç: kararın kendisi 500 veriyordu. Yönetici bir hekimden belge
 * isteyemiyordu ve hekim neden beklediğini öğrenemiyordu.
 *
 * `users.verification_status` bu değeri zaten kabul ediyor (DoctorDashboard
 * 'info_requested' durumunu çiziyor), yani eksik olan yalnız başvuru tablosuydu.
 */
return new class extends Migration
{
    private const YENI = ['pending', 'approved', 'rejected', 'info_requested'];
    private const ESKI = ['pending', 'approved', 'rejected'];

    public function up(): void
    {
        $this->durumlariAyarla(self::YENI);
    }

    public function down(): void
    {
        // Geri alırken kalan kayıtlar kısıtı ihlal etmesin.
        DB::table('verification_requests')
            ->where('status', 'info_requested')
            ->update(['status' => 'pending']);

        $this->durumlariAyarla(self::ESKI);
    }

    private function durumlariAyarla(array $durumlar): void
    {
        if (!Schema::hasTable('verification_requests')) {
            return;
        }

        $driver = DB::connection()->getDriverName();
        $liste = "'" . implode("','", $durumlar) . "'";

        // Sürücüye göre ayrı: TiDB'de `DROP CONSTRAINT IF EXISTS` yok,
        // PostgreSQL'de `MODIFY COLUMN ENUM` yok. (CLAUDE.md, TiDB kuralları.)
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE verification_requests DROP CONSTRAINT IF EXISTS verification_requests_status_check');
            DB::statement("ALTER TABLE verification_requests ADD CONSTRAINT verification_requests_status_check CHECK (status::text = ANY (ARRAY[{$liste}]))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE verification_requests MODIFY COLUMN status ENUM({$liste}) NOT NULL DEFAULT 'pending'");
        } else {
            // SQLite'ta enum bir CHECK kısıtı olarak tablo tanımına gömülü ve
            // özgün göç yalnız üç değeri sayıyor. Sütun düz metne çevriliyor:
            // izin verilen değerleri zaten uygulama katmanı belirliyor ve test
            // veritabanı üretim şemasıyla aynı davranmalı.
            Schema::table('verification_requests', function (Blueprint $table) {
                $table->string('status')->default('pending')->change();
            });
        }
    }
};
