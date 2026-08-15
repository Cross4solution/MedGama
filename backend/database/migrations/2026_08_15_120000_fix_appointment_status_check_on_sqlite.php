<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * SQLite'ta randevu durumu 'no_show' kabul etmiyordu.
 *
 * 2026_03_14_160000 numaralı göç 'no_show' ve 'phone' değerlerini eklerken
 * yalnızca PostgreSQL ve MySQL dallarını güncelledi; "SQLite'ta kısıt yok"
 * varsayımıyla o dal boş bırakıldı. Oysa tabloyu kuran göç `enum()` kullanmış
 * ve SQLite bunu CHECK kısıtına çeviriyor. Sonuç: yerel geliştirmede ve
 * testlerde "gelmedi" işaretlemesi veritabanı hatasıyla düşüyordu.
 *
 * Canlı ortam TiDB (MySQL uyumlu) olduğu için oradaki davranış doğruydu;
 * bu göç yalnızca SQLite'ı hizaya getiriyor. Kolonu düz metne çeviriyoruz:
 * izin verilen değerler zaten istek doğrulamasında (UpdateAppointmentRequest)
 * ve modelde tutuluyor, iki yerde iki liste tutmak yeni bir kayma kaynağı.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'sqlite') {
            return;
        }

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('status', 30)->default('pending')->change();
            $table->string('appointment_type', 30)->default('inPerson')->change();
        });
    }

    public function down(): void
    {
        // Geri alınacak bir şey yok: kısıtı geri koymak hatayı geri getirirdi.
    }
};
