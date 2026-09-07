<?php

use App\Models\Clinic;
use App\Models\DoctorProfile;
use Illuminate\Database\Migrations\Migration;

/**
 * Demo doktor ve kliniklere örnek fiyat (müşteri kararı, 7 Eylül 2026).
 *
 * Canlı veritabanı yeniden tohumlanmıyor (veri korunuyor); bu yüzden
 * tohumdaki fiyatlar canlıya hiç gelmedi ve "fiyata göre sırala" ile fiyat
 * süzgeci boş görünüyordu. Bu göç YALNIZ demo kayıtlara ve YALNIZ fiyatı
 * boşsa yazar; gerçek bir kayıt elle fiyat girmişse dokunulmaz. Geri
 * alınmaz: silinecek bir şema yok, veri demo.
 *
 * Kayıtlar canlıdaki adlarla eşleşiyor (kod adı / tam ad). Eşleşmeyen satır
 * sessizce atlanır — yerel/test veritabanında bu kayıtlar olmayabilir.
 */
return new class extends Migration
{
    private const DOKTORLAR = [
        'Dr. Ayşe Kaya'          => [['label' => 'Muayene', 'min' => 800,  'max' => 1500, 'currency' => 'TRY']],
        'Prof. Dr. Mustafa Çelik'=> [['label' => 'Muayene', 'min' => 2500, 'max' => 4000, 'currency' => 'TRY']],
        'Dr. Fatma Şahin'        => [['label' => 'Muayene', 'min' => 600,  'max' => 900,  'currency' => 'TRY']],
        'Doç. Dr. Emre Yıldız'   => [['label' => 'Muayene', 'min' => 1200, 'max' => 2000, 'currency' => 'TRY']],
        'Dr. Nilüfer Arslan'     => [['label' => 'Muayene', 'min' => 1800, 'max' => 3000, 'currency' => 'TRY']],
        'Doç. Dr. Nazlı Çetin'   => [['label' => 'Muayene', 'min' => 1500, 'max' => 2500, 'currency' => 'TRY']],
        'Dr. Selin Arslan'       => [['label' => 'Muayene', 'min' => 1000, 'max' => 1600, 'currency' => 'TRY']],
        'Dt. Mert Doğan'         => [['label' => 'Muayene', 'min' => 60,   'max' => 90,   'currency' => 'EUR'], ['label' => 'İmplant', 'min' => 700, 'max' => 1200, 'currency' => 'EUR']],
        'Fzt. Burak Şahin'       => [['label' => 'Seans',   'min' => 700,  'max' => 1000, 'currency' => 'TRY']],
        'Op. Dr. Ceren Kılıç'    => [['label' => 'Muayene', 'min' => 2000, 'max' => 3500, 'currency' => 'TRY']],
        'Op. Dr. Emre Taş'       => [['label' => 'Muayene', 'min' => 2200, 'max' => 3800, 'currency' => 'TRY']],
        'Prof. Dr. Kaan Öztürk'  => [['label' => 'Muayene', 'min' => 3000, 'max' => 5000, 'currency' => 'TRY']],
        'Uzm. Dr. Deniz Korkmaz' => [['label' => 'Muayene', 'min' => 900,  'max' => 1400, 'currency' => 'TRY']],
        'Uzm. Dr. Ela Yıldırım'  => [['label' => 'Muayene', 'min' => 150,  'max' => 250,  'currency' => 'USD']],
        'Uzm. Dr. İrem Aydın'    => [['label' => 'Muayene', 'min' => 1100, 'max' => 1800, 'currency' => 'TRY']],
    ];

    private const KLINIKLER = [
        'medagama-clinic'        => [['service' => 'Muayene', 'min' => 1500, 'max' => 3000, 'currency' => 'TRY'], ['service' => 'Kardiyoloji Paketi', 'min' => 12000, 'max' => 25000, 'currency' => 'TRY']],
        'elite-dental-clinic'    => [['service' => 'İmplant', 'min' => 700, 'max' => 1200, 'currency' => 'EUR'], ['service' => 'Diş Beyazlatma', 'min' => 250, 'max' => 400, 'currency' => 'EUR']],
        'vision-eye-clinic'      => [['service' => 'Göz Muayenesi', 'min' => 900, 'max' => 1800, 'currency' => 'TRY'], ['service' => 'Lazer', 'min' => 25000, 'max' => 45000, 'currency' => 'TRY']],
        'life-ortopedi-klinigi'  => [['service' => 'Ortopedi Muayene', 'min' => 2000, 'max' => 3500, 'currency' => 'TRY']],
        'prime-cardio-merkezi'   => [['service' => 'Check-up', 'min' => 400, 'max' => 900, 'currency' => 'USD']],
        'anadolu-tup-bebek'      => [['service' => 'IVF Paketi', 'min' => 3500, 'max' => 6000, 'currency' => 'USD']],
        'beyaz-dis-merkezi'      => [['service' => 'Muayene', 'min' => 500, 'max' => 900, 'currency' => 'TRY'], ['service' => 'Zirkonyum Kaplama', 'min' => 6000, 'max' => 9000, 'currency' => 'TRY']],
        'derma-estetik'          => [['service' => 'Cilt Bakımı', 'min' => 1500, 'max' => 3000, 'currency' => 'TRY']],
        'noro-beyin-merkezi'     => [['service' => 'Muayene', 'min' => 2500, 'max' => 4000, 'currency' => 'TRY']],
        'umut-onkoloji'          => [['service' => 'Konsültasyon', 'min' => 3000, 'max' => 5000, 'currency' => 'TRY']],
        'hareket-fizyoterapi'    => [['service' => 'Seans', 'min' => 600, 'max' => 900, 'currency' => 'TRY']],
        'minik-adimlar-pediatri' => [['service' => 'Muayene', 'min' => 800, 'max' => 1200, 'currency' => 'TRY']],
        'nar-kadin-dogum'        => [['service' => 'Muayene', 'min' => 1200, 'max' => 2000, 'currency' => 'TRY']],
        'vita-uroloji'           => [['service' => 'Muayene', 'min' => 1300, 'max' => 2200, 'currency' => 'TRY']],
        'nefes-kbb'              => [['service' => 'Muayene', 'min' => 1000, 'max' => 1700, 'currency' => 'TRY']],
    ];

    public function up(): void
    {
        foreach (self::DOKTORLAR as $ad => $fiyat) {
            DoctorProfile::whereHas('user', fn ($q) => $q->where('fullname', $ad))
                ->where(fn ($q) => $q->whereNull('prices')->orWhere('prices', '[]'))
                ->get()
                ->each(fn (DoctorProfile $p) => $p->fill(['prices' => $fiyat])->save());
        }

        foreach (self::KLINIKLER as $kodAd => $fiyat) {
            Clinic::where('codename', $kodAd)
                ->where(fn ($q) => $q->whereNull('price_ranges')->orWhere('price_ranges', '[]'))
                ->get()
                ->each(fn (Clinic $c) => $c->fill(['price_ranges' => $fiyat])->save());
        }
    }

    public function down(): void
    {
        // Bilerek boş: demo verisi, geri alınacak şema yok.
    }
};
