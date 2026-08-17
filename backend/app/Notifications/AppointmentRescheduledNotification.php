<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Randevu saati değiştiğinde iki tarafa da gider.
 *
 * Eski saati de yazar: hasta takvimindeki kaydı silip yenisini kurabilsin
 * diye. Yalnızca yeni saati göndermek, hangi randevunun kaydığını
 * anlaşılmaz bırakıyor.
 */
class AppointmentRescheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment,
        public string $eskiTarih,
        public string $eskiSaat,
        public string $recipientRole = 'patient', // patient | doctor
    ) {}

    public function via(object $notifiable): array
    {
        // Randevu bildirimleri hizmetin kendisine ait: kapatılamaz.
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appt     = $this->appointment;
        $locale   = $notifiable->preferred_language ?? 'en';
        $isDoctor = $this->recipientRole === 'doctor';

        $karsiTaraf = $isDoctor
            ? ($appt->patient?->fullname ?? trans('email.a_patient', [], $locale))
            : ($appt->doctor?->fullname ?? trans('email.your_doctor', [], $locale));

        $yeniTarih = $appt->appointment_date?->format('d.m.Y') ?? (string) $appt->appointment_date;

        return (new MailMessage)
            ->subject(trans('email.appt_moved_subject', [], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.appt_moved_subject', [], $locale),
                'headerTitle' => trans('email.appt_moved_header', [], $locale),
                'headerIcon'  => 'calendar',
                'intro'       => trans('email.appt_moved_intro', ['name' => $karsiTaraf], $locale),
                'rows'        => [
                    trans('email.row_old_time', [], $locale) => $this->eskiTarih . ' · ' . $this->eskiSaat,
                    trans('email.row_new_time', [], $locale) => $yeniTarih . ' · ' . $appt->appointment_time,
                    trans('email.row_timezone', [], $locale) => $appt->timezone ?: config('app.timezone'),
                ],
                'outro'       => trans('email.appt_moved_outro', [], $locale),
                'actionUrl'   => config('app.frontend_url') . ($isDoctor ? '/crm/appointments' : '/patient/appointments'),
                'actionLabel' => trans('email.appt_moved_action', [], $locale),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $appt = $this->appointment;

        return [
            'type'             => 'appointment_rescheduled',
            'appointment_id'   => $appt->id,
            'title'            => 'Appointment rescheduled',
            'message'          => 'Your appointment moved to ' . ($appt->appointment_date?->format('d.m.Y') ?? '') . ' ' . $appt->appointment_time . '.',
            'old_date'         => $this->eskiTarih,
            'old_time'         => $this->eskiSaat,
            'appointment_date' => $appt->appointment_date?->toDateString(),
            'appointment_time' => $appt->appointment_time,
        ];
    }
}
