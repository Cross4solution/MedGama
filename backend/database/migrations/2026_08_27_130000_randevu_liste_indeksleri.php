<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Randevu listelerinin sıralama indeksleri.
 *
 * Hacim testinde bulundu. 8 MB'lık geliştirme verisinde her şey hızlı
 * görünüyordu; 1.000.000 randevu üretilip ölçüldüğünde hekimin kendi randevu
 * listesi — ürünün en sık açılan ekranı — **813 ms** sürdü.
 *
 * Sebep indeks yokluğu değil, YANLIŞ indeks. Sorgu şu:
 *
 *     WHERE doctor_id = ? AND deleted_at IS NULL
 *     ORDER BY created_at DESC LIMIT 20
 *
 * Mevcut `(doctor_id, appointment_date)` indeksi hekimin satırlarını buluyor
 * ama `created_at`'e göre sıralı değil. Veritabanı 9.954 satırı okuyup
 * belleğe alıyor, elle sıralıyor (filesort), sonra ilk 20'sini veriyor.
 * Geri kalan 9.934 satırı okumak tamamen boşa.
 *
 * `(doctor_id, deleted_at, created_at)` ile satırlar zaten sıralı geliyor:
 * veritabanı 20 satır okuyup duruyor. Ölçüldü: **813 ms → 10 ms**.
 *
 * Aynı desen hasta ve klinik listelerinde de var. Onlar bugün hızlı görünüyor
 * çünkü geliştirme verisinde hasta başına on randevu var — yoğun bir klinikte
 * aynı 813 ms çıkar. Üçü birlikte düzeltiliyor; biri bugün acımıyor diye
 * beklemek, aynı ölçümü altı ay sonra baştan yapmak demek.
 */
return new class extends Migration
{
    private const INDEKSLER = [
        ['doctor_id',  'idx_appointments_doctor_deleted_created'],
        ['patient_id', 'idx_appointments_patient_deleted_created'],
        ['clinic_id',  'idx_appointments_clinic_deleted_created'],
    ];

    public function up(): void
    {
        Schema::table('appointments', function ($tablo) {
            foreach (self::INDEKSLER as [$sutun, $ad]) {
                $tablo->index([$sutun, 'deleted_at', 'created_at'], $ad);
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function ($tablo) {
            foreach (self::INDEKSLER as [, $ad]) {
                $tablo->dropIndex($ad);
            }
        });
    }
};
