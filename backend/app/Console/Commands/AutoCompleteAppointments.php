<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Geçmiş tarihteki onaylanmış randevuları otomatik 'completed' yapar.
 * Her 15 dakikada bir çalışır (routes/console.php).
 * Sadece bu cron tarafından completed yapılan randevular auto_completed_at ile işaretlenir.
 */
class AutoCompleteAppointments extends Command
{
    protected $signature = 'appointments:auto-complete';

    protected $description = 'Randevu saati geçmiş confirmed randevuları otomatik olarak completed durumuna geçirir';

    public function handle(): int
    {
        $now = Carbon::now();

        // confirmed + tarihi geçmiş + henüz auto-complete edilmemiş randevular
        $query = Appointment::query()
            ->where('status', 'confirmed')
            ->whereNull('auto_completed_at')
            ->whereRaw(
                "CONCAT(appointment_date, ' ', appointment_time, ':00') <= ?",
                [$now->toDateTimeString()]
            );

        $count = (clone $query)->count();

        if ($count === 0) {
            $this->info('[auto-complete] Tamamlanacak randevu yok.');
            return self::SUCCESS;
        }

        // Toplu güncelleme — tek update sorgusuyla performans
        $query->update([
            'status'            => 'completed',
            'auto_completed_at' => $now,
            'updated_at'        => $now,
        ]);

        $this->info("[auto-complete] {$count} randevu otomatik olarak completed durumuna geçirildi.");
        \Log::info('AutoCompleteAppointments: ' . $count . ' randevu güncellendi.');

        return self::SUCCESS;
    }
}
