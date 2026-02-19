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
