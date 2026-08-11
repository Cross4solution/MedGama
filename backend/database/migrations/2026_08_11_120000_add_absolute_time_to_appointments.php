<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Randevuyu mutlak bir ana bağlar.
 *
 * Şimdiye kadar yalnızca appointment_date + appointment_time ("2026-08-11" +
 * "14:00") saklanıyordu; bunun HANGİ ülkenin saati olduğu hiçbir yerde yazmıyordu.
 * Sunucu UTC çalıştığı için Türkiye'den girilen her randevuyu 3 saat ileride
 * sanıyordu: doktorun 2 saatlik red penceresi, 24s/1s hatırlatmalar ve otomatik
 * tamamlama hep kaymış hesaplıyordu. Yurt dışından hasta geldiğinde ("13:00 mi
 * 14:00 mü?") sorun tamamen kontrolden çıkardı.
 *
 * Çözüm sektör standardı: dünyada tek bir ana karşılık gelen `starts_at` (UTC)
 * saklanır ve yanında o duvar saatinin ait olduğu saat diliminin ADI tutulur.
 * Ofset (+03:00) DEĞİL, ad (Europe/Istanbul) — çünkü ofset yaz saatiyle değişir;
 * Türkiye 2016'dan beri sabit +03 ama Almanya/İngiltere/ABD hastaları değil.
 * Duvar saati alanları ekranda gösterim için olduğu gibi kalır.
 */
return new class extends Migration
{
    private const VARSAYILAN_TZ = 'Europe/Istanbul';

    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Mutlak an (UTC). Tüm zaman karşılaştırmaları buradan yapılır.
            $table->dateTime('starts_at')->nullable()->after('appointment_time');
            // Duvar saatinin ait olduğu IANA saat dilimi adı (ör. Europe/Istanbul).
            // TEXT değil string: indekslenebilir olmalı (TiDB kuralı).
            $table->string('timezone', 64)->nullable()->after('starts_at');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->index('starts_at', 'idx_appointments_starts_at');
        });

        // Sağlayıcının saat dilimi: randevu alınırken duvar saatinin hangi
        // ülkeye ait olduğunu bundan çözüyoruz.
        foreach (['clinics', 'doctor_profiles'] as $tablo) {
            if (Schema::hasTable($tablo) && !Schema::hasColumn($tablo, 'timezone')) {
                Schema::table($tablo, function (Blueprint $table) {
                    $table->string('timezone', 64)->nullable();
                });
            }
        }

        $this->doldur();
    }

    /**
     * Mevcut kayıtlar: duvar saatleri Türkiye saati varsayılarak UTC'ye çevrilir.
     * Bugüne kadar sisteme yalnız Türkiye üzerinden randevu girildi; bu varsayım
     * geçmiş veri için doğru. SQL yerine PHP: CONVERT_TZ adlandırılmış saat
     * dilimi tablolarına bağlı ve TiDB'de yüklü olmayabiliyor.
     */
    private function doldur(): void
    {
        DB::table('appointments')
            ->select('id', 'appointment_date', 'appointment_time')
            ->whereNull('starts_at')
            ->orderBy('id')
            ->chunk(500, function ($satirlar) {
                foreach ($satirlar as $s) {
                    if (!$s->appointment_date || !$s->appointment_time) {
                        continue;
                    }

                    try {
                        $tarih = substr((string) $s->appointment_date, 0, 10);
                        $saat  = substr((string) $s->appointment_time, 0, 5);
                        $an = Carbon::createFromFormat(
                            'Y-m-d H:i',
                            $tarih . ' ' . $saat,
                            self::VARSAYILAN_TZ
                        )->utc();
                    } catch (\Throwable) {
                        continue; // okunamayan kaydı atla, migration'ı düşürme
                    }

                    DB::table('appointments')->where('id', $s->id)->update([
                        'starts_at' => $an->toDateTimeString(),
                        'timezone'  => self::VARSAYILAN_TZ,
                    ]);
                }
            });

        foreach (['clinics', 'doctor_profiles'] as $tablo) {
            if (Schema::hasTable($tablo) && Schema::hasColumn($tablo, 'timezone')) {
                DB::table($tablo)->whereNull('timezone')->update(['timezone' => self::VARSAYILAN_TZ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appointments_starts_at');
            $table->dropColumn(['starts_at', 'timezone']);
        });

        foreach (['clinics', 'doctor_profiles'] as $tablo) {
            if (Schema::hasTable($tablo) && Schema::hasColumn($tablo, 'timezone')) {
                Schema::table($tablo, function (Blueprint $table) {
                    $table->dropColumn('timezone');
                });
            }
        }
    }
};
