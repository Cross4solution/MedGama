<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appt = $this->appointment;
        $locale = $notifiable->preferred_language ?? 'en';
        $date = $appt->appointment_date?->format('d M Y') ?? $appt->appointment_date;
        $time = $appt->appointment_time;
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        return (new MailMessage)
            ->subject('MedGama — ' . trans('email.appt_confirmed_subject', [], $locale))
            ->view('emails.appointment-confirmed-v2', [
                'locale'     => $locale,
                'userName'   => $notifiable->fullname ?? $notifiable->email,
                'doctorName' => $appt->doctor?->fullname ?? 'Your doctor',
                'date'       => $date,
                'time'       => $time,
                'videoLink'  => $appt->video_conference_link ?? '',
                'actionUrl'  => $appt->video_conference_link ?: $frontendUrl . '/telehealth',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $appt = $this->appointment;
        return [
            'type' => 'appointment_confirmed',
            'appointment_id' => $appt->id,
            'title' => 'Appointment Confirmed',
            'message' => 'Your appointment with ' . ($appt->doctor?->fullname ?? 'doctor') . ' on ' . ($appt->appointment_date?->format('d M Y') ?? '') . ' at ' . $appt->appointment_time . ' has been confirmed.',
            'doctor_id' => $appt->doctor_id,
            'patient_id' => $appt->patient_id,
            'appointment_date' => $appt->appointment_date?->toDateString(),
            'appointment_time' => $appt->appointment_time,
            'appointment_type' => $appt->appointment_type,
            'video_conference_link' => $appt->video_conference_link,
            'status' => 'confirmed',
        ];
    }
}
