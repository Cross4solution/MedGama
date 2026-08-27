<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
*/
Schedule::command('appointments:send-reminders')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Onaylı Review Sistemi — geçmiş confirmed randevuları otomatik tamamla
Schedule::command('appointments:auto-complete')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Yarım kalan kapora ödemeleri: tuttukları randevu saatini serbest bırak.
// Sık çalışmalı, yoksa saat gereğinden uzun bloke kalır.
Schedule::command('payments:expire-stale')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// GDPR Art. 5(1)(e) — Prune expired soft-deleted records daily at 03:00
// User: 3 years, Appointment/DigitalAnamnesis/PatientRecord: 10 years
Schedule::command('model:prune', [
    '--model' => [
        \App\Models\User::class,
        \App\Models\Appointment::class,
        \App\Models\DigitalAnamnesis::class,
        \App\Models\PatientRecord::class,
    ],
])->dailyAt('03:00')->runInBackground();

// ── Altyapı tablolarının bakımı ─────────────────────────────────────────
//
// Bunlar yalnızca BÜYÜYEN tablolar: her giriş bir jeton, her başarısız iş bir
// satır bırakıyor ve hiçbiri kendi kendine gitmiyordu. Ölçüldü: demo
// veritabanında 801 jeton birikmişti ve 83'ünün süresi çoktan dolmuştu.
//
// `personal_access_tokens` her kimlikli istekte okunuyor, yani büyümesinin
// bedeli doğrudan gecikmeye yazılıyor.
//
// Hiçbirinin saklama yükümlülüğü yok: süresi dolmuş bir jeton işe yaramaz,
// bir haftalık başarısız iş kaydı hata ayıklamaya yeter. Denetim kayıtları
// ve bildirimler bilerek DIŞARIDA — onların süresi hukuki bir karar.
Schedule::command('sanctum:prune-expired', ['--hours' => 24])
    ->dailyAt('03:20')
    ->runInBackground();

Schedule::command('queue:prune-failed', ['--hours' => 168])
    ->weeklyOn(1, '03:30')
    ->runInBackground();

Schedule::command('queue:prune-batches', ['--hours' => 168])
    ->weeklyOn(1, '03:35')
    ->runInBackground();

// Süresi geçmiş şifre sıfırlama anahtarları: duran her satır kullanılabilir
// bir anahtar gibi görünüyor.
Schedule::command('auth:clear-resets')
    ->dailyAt('03:40')
    ->runInBackground();

// ── Veritabanı yedeği ───────────────────────────────────────────────────
//
// Yedekleme tarafında hiçbir şey yoktu. Hasta verisi tutan bir sistemde bu,
// diğer bütün risklerden ağır: kaybedilen veri test edilerek geri gelmiyor.
//
// Budamalardan SONRA çalışıyor (03:40 → 04:10) ki yedek, o gece silinmiş
// kayıtları içermesin — aksi halde "silindi" dediğimiz veri yedekte yaşamaya
// devam eder ve saklama politikası kâğıt üstünde kalır.
//
// Dosyanın sunucu DIŞINA taşınması ayrı bir iştir; komut hedef yerel diskse
// uyarıyor. Yedeğin aynı makinede durması, makineyi kaybettiren arızada
// hiçbir işe yaramaz.
// Günde DÖRT kez: 04:10, 10:10, 16:10, 22:10.
//
// Sıklık kayıp penceresini belirliyor (RPO). Gecede bir yedekle öğlen çıkan bir
// arıza o sabahki her şeyi götürüyordu — alınan randevular, yazılan mesajlar,
// kesilen faturalar. Kimse fark etmez: hasta gelir, kaydı yoktur. Dört yedekle
// pencere 24 saatten 6 saate iniyor.
//
// Yer sorunu yok: yedekler sıkıştırılıyor (ölçüldü, 20 kat), 5 milyon randevuda
// yedi günlük dört yedek 3 GB — disk 10 GB.
//
// Saatler AÇIKÇA yazılı, `everySixHours` değil. O, 00:10'da da çalışırdı; oysa
// budama işleri 03:00-03:40 arasında koşuyor ve yedek onlardan SONRA gelmeli.
// Önce alınsaydı o gece silinen kayıtlar yedekte yaşamaya devam eder ve
// "silindi" dediğimiz veri geri gelebilir hâlde kalırdı.
//
// NOT: Bu sıklık yalnız YAZILIM arızalarına karşı işe yarıyor — bozuk göç,
// yanlışlıkla silme, hatalı dağıtım. Yedekler hâlâ verinin durduğu makinede;
// donanım arızasında veritabanı, dosyalar ve yedekler birlikte gider.
// `YEDEK_DISK` sunucu dışına bağlanana kadar bu böyle.
Schedule::command('db:yedek')
    ->cron('10 4,10,16,22 * * *')
    ->withoutOverlapping()
    ->runInBackground();
