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
