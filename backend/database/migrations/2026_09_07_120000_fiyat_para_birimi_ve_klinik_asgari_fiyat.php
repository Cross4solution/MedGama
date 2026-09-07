<?php

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Support\Fiyat;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fiyat aralığı süzgeci: doktor ve klinik listesinde "en az / en çok".
 *
 * Fiyatlar farklı para birimlerinde olabiliyor; süzgeç seçilen birimde
 * çalışır. Bunun için en düşük fiyatın yanına birimi de yazılıyor
 * (`price_currency`). Klinikler için `min_price` de burada ekleniyor
 * (`price_ranges` JSON'undan; doktorda bir önceki göçle gelmişti).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->string('price_currency', 3)->nullable()->after('min_price');
            $table->index(['price_currency', 'min_price']);
        });
        Schema::table('clinics', function (Blueprint $table) {
            $table->decimal('min_price', 12, 2)->nullable()->after('price_ranges');
            $table->string('price_currency', 3)->nullable()->after('min_price');
            $table->index(['price_currency', 'min_price']);
        });

        DoctorProfile::query()->whereNotNull('prices')->chunkById(200, function ($profiller) {
            foreach ($profiller as $profil) {
                $f = Fiyat::asgari($profil->prices);
                $profil->min_price = $f['min'];
                $profil->price_currency = $f['currency'];
                $profil->saveQuietly();
            }
        });
        Clinic::query()->whereNotNull('price_ranges')->chunkById(200, function ($klinikler) {
            foreach ($klinikler as $klinik) {
                $f = Fiyat::asgari($klinik->price_ranges);
                $klinik->min_price = $f['min'];
                $klinik->price_currency = $f['currency'];
                $klinik->saveQuietly();
            }
        });
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropIndex(['price_currency', 'min_price']);
            $table->dropColumn('price_currency');
        });
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropIndex(['price_currency', 'min_price']);
            $table->dropColumn(['min_price', 'price_currency']);
        });
    }
};
