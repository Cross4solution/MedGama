<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentReminderNotification;
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

        return self::SUCCESS;
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
