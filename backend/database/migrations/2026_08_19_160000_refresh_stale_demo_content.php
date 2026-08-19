<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Canlıdaki demo içeriğini tazeler: marka yazımı ve eskimiş gönderi tarihleri.
 *
 * Neden göç olarak yazıldı: tohumlayıcı üretimde bilerek çalışmıyor (zayıf demo
 * parolalarını canlıya yazmasın diye) ve o freni kaldırmak bu iş için orantısız
 * bir risk. Göç ise dağıtımda kendiliğinden çalışır, yalnızca aşağıdaki iki
 * şeye dokunur, hesap oluşturmaz ve parola yazmaz.
 *
 * 1) Marka yazımı: canlı veritabanında klinik adı "MedaGama" olarak kalmış.
 *    Doğrusu "Medagama" — tohumlayıcı zaten doğrusunu yazıyor, düzeltilmemiş
 *    olan yalnızca mevcut kayıt.
 *
 * 2) Gönderi tarihleri: demo gönderileri 100 günü aşmıştı. MedStream'in "en çok
 *    etkileşim" sekmesi son 30 günü gösterdiği için bomboş görünüyordu. Kod
 *    doğru çalışıyordu, içerik eskimişti.
 *
 *    Tarihler tek tek atanmıyor, hepsi AYNI miktarda öne kaydırılıyor: aradaki
 *    göreli sıra ve boşluklar korunuyor, akış doğal görünmeye devam ediyor.
 *
 *    Yalnızca 60 günden eski gönderiler kaydırılıyor. Sonradan girilmiş gerçek
 *    içeriğe dokunmamak için sınır bilerek geniş tutuldu.
 */
return new class extends Migration
{
    /** Bu tarihten eski gönderiler bayat demo içeriği sayılır. */
    private const BAYATLIK_GUN = 60;

    /** Kaydırma sonrası en yeni gönderinin ne kadar öncesine düşeceği. */
    private const EN_YENI_SAAT_ONCE = 2;

    public function up(): void
    {
        $this->markaYaziminiDuzelt();
        $this->gonderiTarihleriniOneKaydir();
    }

    /**
     * Geri alma bilinçli olarak boş.
     *
     * Tarihleri geri itmek demoyu yeniden bozmak olurdu; marka yazımını geri
     * almak ise zaten istenmeyen hâle dönmek demek.
     */
    public function down(): void
    {
    }

    private function markaYaziminiDuzelt(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('clinics')) {
            return;
        }

        foreach (['name', 'fullname'] as $sutun) {
            DB::table('clinics')
                ->where($sutun, 'LIKE', '%MedaGama%')
                ->orWhere($sutun, 'LIKE', '%MedGama%')
                ->get(['id', $sutun])
                ->each(function ($satir) use ($sutun) {
                    $duzeltilmis = str_ireplace(['MedaGama', 'MedGama'], 'Medagama', $satir->{$sutun});

                    if ($duzeltilmis !== $satir->{$sutun}) {
                        DB::table('clinics')->where('id', $satir->id)->update([$sutun => $duzeltilmis]);
                    }
                });
        }
    }

    private function gonderiTarihleriniOneKaydir(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('med_stream_posts')) {
            return;
        }

        $sinir = Carbon::now()->subDays(self::BAYATLIK_GUN);

        $enYeni = DB::table('med_stream_posts')
            ->whereNull('deleted_at')
            ->where('created_at', '<', $sinir)
            ->max('created_at');

        if (!$enYeni) {
            return; // bayat gönderi yok — yapacak bir şey de yok
        }

        // Tüm gönderileri aynı miktarda öteleyen fark: en yenisi "2 saat önce"
        // olacak şekilde hesaplanıyor.
        $fark = Carbon::now()->subHours(self::EN_YENI_SAAT_ONCE)->getTimestamp()
            - Carbon::parse($enYeni)->getTimestamp();

        if ($fark <= 0) {
            return;
        }

        DB::table('med_stream_posts')
            ->whereNull('deleted_at')
            ->where('created_at', '<', $sinir)
            ->orderBy('id')
            ->chunkById(200, function ($gonderiler) use ($fark) {
                foreach ($gonderiler as $gonderi) {
                    $yeni = Carbon::parse($gonderi->created_at)->addSeconds($fark);

                    DB::table('med_stream_posts')
                        ->where('id', $gonderi->id)
                        ->update(['created_at' => $yeni]);
                }
            });
    }
};
