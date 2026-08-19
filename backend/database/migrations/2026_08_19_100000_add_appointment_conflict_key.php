<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Aynı doktorun aynı saatinin iki kez verilmesini veritabanı seviyesinde
 * engeller.
 *
 * Neden uygulama kontrolü yetmiyor: iki istek aynı anda "bu saat boş" diye
 * okuyup ikisi de yazabilir. Aradaki boşluk milisaniyeliktir ama yük altında
 * gerçekleşir — canlıda 5 eşzamanlı istekten 5'i birden kabul edildi.
 *
 * Yöntem: aktif randevular için doktor+tarih+saat'ten türeyen bir anahtar
 * tutulur ve BENZERSİZ. İptal edilen/tamamlanan randevuda anahtar NULL olur;
 * MySQL/TiDB benzersiz dizinde birden çok NULL'a izin verdiği için o saat
 * yeniden verilebilir hâle gelir.
 *
 * Geriye dönük doldurma, çakışan mevcut kayıtlardan yalnızca EN ESKİsine
 * anahtar verir. Diğerleri elle silinmez: bir hastanın randevusunu göç
 * sırasında sessizce iptal etmek bizim kararımız değil.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('cakisma_anahtari', 191)->nullable()->after('slot_id');
        });

        // Aktif randevuları doldur; her çakışma grubunda yalnızca en eskisi.
        $aktif = DB::table('appointments')
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereNull('deleted_at')
            ->orderBy('created_at')
            ->get(['id', 'doctor_id', 'appointment_date', 'appointment_time']);

        $gorulen = [];
        foreach ($aktif as $randevu) {
            if (!$randevu->doctor_id) {
                continue;
            }

            $anahtar = $randevu->doctor_id . '|' . substr((string) $randevu->appointment_date, 0, 10)
                . '|' . substr((string) $randevu->appointment_time, 0, 5);

            if (isset($gorulen[$anahtar])) {
                continue; // çakışan kayıt: anahtarsız bırakılır, elle bakılacak
            }

            $gorulen[$anahtar] = true;
            DB::table('appointments')->where('id', $randevu->id)->update(['cakisma_anahtari' => $anahtar]);
        }

        Schema::table('appointments', function (Blueprint $table) {
            $table->unique('cakisma_anahtari', 'appointments_cakisma_unique');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropUnique('appointments_cakisma_unique');
            $table->dropColumn('cakisma_anahtari');
        });
    }
};
