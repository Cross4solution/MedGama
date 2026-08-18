<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Muayene kaydı dosya olmadan da açılabilmeli.
 *
 * `patient_records` tablosu başta yalnızca yüklenen belgeler için vardı ve
 * `file_url` zorunluydu. Muayene ve reçete sonradan aynı tabloya eklendi ama
 * sütun zorunlu kaldı: dosyası olmayan her muayene kaydı NOT NULL kısıtına
 * takılıyor, kullanıcı 500 görüyordu. Yani muayene özelliği hiç çalışmıyordu.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_records', function (Blueprint $table) {
            $table->string('file_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('patient_records', function (Blueprint $table) {
            $table->string('file_url')->nullable(false)->change();
        });
    }
};
