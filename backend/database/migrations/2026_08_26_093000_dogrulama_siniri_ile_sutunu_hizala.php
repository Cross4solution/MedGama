<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Doğrulama 500 karaktere izin veriyor, sütun 255 tutuyordu.
 *
 * Dört alanda kural `string|max:500` ama sütun `varchar(255)`. Arada kalan
 * girdi — 256 ile 500 karakter arası — doğrulamadan GEÇİYOR, sonra
 * veritabanı `SQLSTATE[22001] Data too long` diyor. Kullanıcı formu düzgün
 * doldurmuş oluyor ve 500 alıyor.
 *
 * Yerelde görünmüyor: SQLite varchar uzunluğunu uygulamıyor. Aynı sınıf,
 * sohbet eki adresinde de çıkmıştı (2026_08_26_090000).
 *
 * Sütun genişletiliyor, doğrulama daraltılmıyor: üç yüz karakterlik bir
 * klinik adresi ya da bir kayıp gerekçesi meşru. Sınırı düşürmek, kullanıcının
 * yazdığı doğru veriyi reddetmek olurdu.
 */
return new class extends Migration
{
    /** tablo => [sütun, ...] — hepsi `string|max:500` doğrulamasına sahip. */
    private const HIZALANACAK = [
        'announcements'   => ['link_url'],
        'clinics'         => ['address'],
        'doctor_profiles' => ['address'],
        'leads'           => ['lost_reason'],
    ];

    public function up(): void
    {
        foreach (self::HIZALANACAK as $tablo => $sutunlar) {
            if (!Schema::hasTable($tablo)) {
                continue;
            }

            Schema::table($tablo, function (Blueprint $table) use ($tablo, $sutunlar) {
                foreach ($sutunlar as $sutun) {
                    if (Schema::hasColumn($tablo, $sutun)) {
                        $table->string($sutun, 500)->nullable()->change();
                    }
                }
            });
        }
    }

    public function down(): void
    {
        foreach (self::HIZALANACAK as $tablo => $sutunlar) {
            if (!Schema::hasTable($tablo)) {
                continue;
            }

            Schema::table($tablo, function (Blueprint $table) use ($tablo, $sutunlar) {
                foreach ($sutunlar as $sutun) {
                    if (Schema::hasColumn($tablo, $sutun)) {
                        $table->string($sutun, 255)->nullable()->change();
                    }
                }
            });
        }
    }
};
