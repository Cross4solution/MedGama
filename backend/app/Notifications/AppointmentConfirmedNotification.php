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
        $date = $appt->appointment_date?->format('d M Y') ?? $appt->appointment_date;
        $time = $appt->appointment_time;
        $doctorName = $appt->doctor?->fullname ?? 'Your doctor';

        $mail = (new MailMessage)
            ->subject('MedGama — Appointment Confirmed')
            ->greeting("Great news, {$notifiable->fullname}!")
            ->line('Your appointment has been confirmed by the doctor.')
            ->line("**Doctor:** {$doctorName}")
            ->line("**Date:** {$date}")
            ->line("**Time:** {$time}");

        if ($appt->video_conference_link) {
            $mail->action('Join Video Call', $appt->video_conference_link);
        } else {
            $mail->action('View My Appointments', url('/telehealth'));
        }

        return $mail->line('Please make sure to be available at the scheduled time.');
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
