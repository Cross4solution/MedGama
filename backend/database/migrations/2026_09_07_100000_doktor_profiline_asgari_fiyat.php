<?php

use App\Models\DoctorProfile;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Doktor listesinde fiyata göre sıralama.
 *
 * Fiyatlar `prices` JSON sütununda `[{label, min, max, currency}]` olarak
 * duruyor; JSON içinden sıralamak her veritabanında farklı yazılır (TiDB,
 * PostgreSQL, SQLite) ve indekslenemez. Bunun yerine kaydederken en düşük
 * fiyat ayrı bir sütuna yazılıyor (model `saving` kancası) ve sıralama
 * o sütundan yapılıyor. Burada mevcut kayıtlar bir kez dolduruluyor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->decimal('min_price', 12, 2)->nullable()->after('prices');
            $table->index('min_price');
        });

        // Mevcut profiller: JSON'dan hesapla. Kancayı tetiklemek için
        // model üzerinden kaydediliyor; sayı az, döngü yeterli.
        DoctorProfile::query()->whereNotNull('prices')->chunkById(200, function ($profiller) {
            foreach ($profiller as $profil) {
                $profil->min_price = DoctorProfile::asgariFiyat($profil->prices);
                $profil->saveQuietly();
            }
        });
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropIndex(['min_price']);
            $table->dropColumn('min_price');
        });
    }
};
