<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment,
        public string $recipientRole = 'patient',
        public string $reminderType = '24h', // 24h | 1h
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
        $isOnline = $appt->appointment_type === 'online';
        $timeLabel = $this->reminderType === '1h' ? '1 hour' : '24 hours';

        if ($this->recipientRole === 'doctor') {
            $patientName = $appt->patient?->fullname ?? 'A patient';
            $mail = (new MailMessage)
                ->subject("MedGama — Appointment in {$timeLabel}")
                ->greeting("Hello, Dr. {$notifiable->fullname}!")
                ->line("You have an appointment in **{$timeLabel}**.")
                ->line("**Patient:** {$patientName}")
                ->line("**Date:** {$date}")
                ->line("**Time:** {$time}")
                ->line("**Type:** " . ucfirst($appt->appointment_type ?? 'online'));

            if ($appt->confirmation_note) {
                $mail->line("**Patient Note:** {$appt->confirmation_note}");
            }

            return $mail->action('View Appointments', url('/crm/appointments'))
                ->line('Please make sure to be available at the scheduled time.');
        }

        $doctorName = $appt->doctor?->fullname ?? 'Your doctor';
        $mail = (new MailMessage)
            ->subject("MedGama — Appointment Reminder ({$timeLabel})")
            ->greeting("Hello, {$notifiable->fullname}!")
            ->line("This is a friendly reminder that your appointment is in **{$timeLabel}**.")
            ->line("**Doctor:** {$doctorName}")
            ->line("**Date:** {$date}")
            ->line("**Time:** {$time}");

        if ($isOnline && $appt->video_conference_link) {
            $mail->action('Join Video Call', $appt->video_conference_link);
        } else {
            $mail->action('View My Appointments', url('/telehealth'));
        }

        if ($isOnline) {
            $mail->line('Please ensure you have a stable internet connection and your camera/microphone are working properly.');
        } else {
            $mail->line('Please arrive 10 minutes before your scheduled time.');
        }

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        $appt = $this->appointment;
        $timeLabel = $this->reminderType === '1h' ? '1 hour' : '24 hours';

        return [
            'type' => 'appointment_reminder',
            'appointment_id' => $appt->id,
            'title' => "Appointment in {$timeLabel}",
            'message' => $this->recipientRole === 'doctor'
                ? 'Appointment with ' . ($appt->patient?->fullname ?? 'patient') . ' in ' . $timeLabel . ' — ' . ($appt->appointment_date?->format('d M Y') ?? '') . ' at ' . $appt->appointment_time
                : 'Your appointment with ' . ($appt->doctor?->fullname ?? 'doctor') . ' is in ' . $timeLabel . ' — ' . ($appt->appointment_date?->format('d M Y') ?? '') . ' at ' . $appt->appointment_time,
            'doctor_id' => $appt->doctor_id,
            'patient_id' => $appt->patient_id,
            'appointment_date' => $appt->appointment_date?->toDateString(),
            'appointment_time' => $appt->appointment_time,
            'appointment_type' => $appt->appointment_type,
            'video_conference_link' => $appt->video_conference_link,
            'reminder_type' => $this->reminderType,
            'status' => $appt->status,
        ];
    }
}
