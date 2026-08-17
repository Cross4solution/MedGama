<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentReminderNotification;
use App\Notifications\VideoCallStartingNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendAppointmentReminders extends Command
{
    protected $signature = 'appointments:send-reminders';
    protected $description = 'Send appointment reminder notifications (24h and 1h before)';

    public function handle(): int
    {
        $now = Carbon::now();

        // ── 24-hour reminders ──
        $this->sendReminders(
            from: $now->copy()->addHours(23)->addMinutes(45),
            to: $now->copy()->addHours(24)->addMinutes(15),
            type: '24h',
        );

        // ── 1-hour reminders ──
        $this->sendReminders(
            from: $now->copy()->addMinutes(45),
            to: $now->copy()->addHours(1)->addMinutes(15),
            type: '1h',
        );

        // ── Görüntülü görüşme: başlamadan hemen önce ──
        // Ayrı tutuluyor çünkü ne aynı içerik ne aynı zamanlama: 24 saat ve
        // 1 saat önceki hatırlatma takvime yazdırmak için, bu ise odaya
        // girmek için. Sadece online randevulara gider.
        $this->sendVideoCallAlerts(
            from: $now->copy()->addMinutes(5),
            to: $now->copy()->addMinutes(15),
        );

        return self::SUCCESS;
    }

    /**
     * Başlamak üzere olan görüntülü görüşmeler için katılım bağlantısı gönder.
     */
    private function sendVideoCallAlerts(Carbon $from, Carbon $to): void
    {
        $appointments = Appointment::active()
            ->where('appointment_type', 'online')
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereNotNull('starts_at')
            ->whereBetween('starts_at', [$from->utc(), $to->utc()])
            ->with(['patient', 'doctor'])
            ->get();

        $sent = 0;

        foreach ($appointments as $appointment) {
            foreach (['patient', 'doctor'] as $rol) {
                $alici = $appointment->{$rol};
                if (!$alici) {
                    continue;
                }

                // Zamanlayıcı dakikada bir koşuyor, pencere ise 10 dakika:
                // aynı görüşme için tekrar tekrar gönderilmesini bu engelliyor.
                $zatenGitti = $alici->notifications()
                    ->where('type', VideoCallStartingNotification::class)
                    ->whereJsonContains('data->appointment_id', $appointment->id)
                    ->exists();

                if ($zatenGitti) {
                    continue;
                }

                $alici->notify(new VideoCallStartingNotification($appointment, $rol));
                $sent++;
            }
        }

        $this->info("[call] Sent {$sent} alert(s) for {$appointments->count()} video appointment(s).");
    }

    private function sendReminders(Carbon $from, Carbon $to, string $type): void
    {
        $appointments = Appointment::active()
            ->whereIn('status', ['pending', 'confirmed'])
            // Duvar saatini (appointment_date + appointment_time) doğrudan sunucu
            // saatiyle karşılaştırmak yanlıştı: sunucu UTC, saatler ise kliniğin
            // yerel saati. Türkiye randevuları 3 saat kaymış hesaplanıyor, hasta
            // hatırlatmayı yanlış zamanda alıyordu. Karşılaştırma artık mutlak an
            // (starts_at, UTC) üzerinden.
            ->whereNotNull('starts_at')
            ->whereBetween('starts_at', [$from->utc(), $to->utc()])
            ->with(['patient', 'doctor'])
            ->get();

        $sent = 0;

        foreach ($appointments as $appointment) {
            // Check if we already sent this reminder type (avoid duplicates)
            $alreadySent = $appointment->patient
                ?->notifications()
                ->where('type', AppointmentReminderNotification::class)
                ->whereJsonContains('data->appointment_id', $appointment->id)
                ->whereJsonContains('data->reminder_type', $type)
                ->exists();

            if ($alreadySent) {
                continue;
            }

            // Notify patient
            if ($appointment->patient) {
                $appointment->patient->notify(
                    new AppointmentReminderNotification($appointment, 'patient', $type)
                );
                $sent++;
            }

            // Notify doctor
            if ($appointment->doctor) {
                $doctorAlreadySent = $appointment->doctor
                    ->notifications()
                    ->where('type', AppointmentReminderNotification::class)
                    ->whereJsonContains('data->appointment_id', $appointment->id)
                    ->whereJsonContains('data->reminder_type', $type)
                    ->exists();

                if (!$doctorAlreadySent) {
                    $appointment->doctor->notify(
                        new AppointmentReminderNotification($appointment, 'doctor', $type)
                    );
                    $sent++;
                }
            }
        }

        $this->info("[{$type}] Sent {$sent} reminder(s) for {$appointments->count()} appointment(s).");
    }
}
