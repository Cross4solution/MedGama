<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentBookedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment,
        public string $recipientRole = 'patient', // patient | doctor
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
        $type = ucfirst($appt->appointment_type ?? 'online');

        if ($this->recipientRole === 'doctor') {
            $patientName = $appt->patient?->fullname ?? 'A patient';
            return (new MailMessage)
                ->subject('MedGama — New Appointment Request')
                ->greeting("Hello, Dr. {$notifiable->fullname}!")
                ->line("{$patientName} has booked an appointment with you.")
                ->line("**Date:** {$date}")
                ->line("**Time:** {$time}")
                ->line("**Type:** {$type}")
                ->line($appt->confirmation_note ? "**Patient Note:** {$appt->confirmation_note}" : '')
                ->action('View Appointments', url('/crm/appointments'))
                ->line('Please confirm or manage this appointment from your dashboard.');
        }

        $doctorName = $appt->doctor?->fullname ?? 'Your doctor';
        return (new MailMessage)
            ->subject('MedGama — Appointment Booked')
            ->greeting("Hello, {$notifiable->fullname}!")
            ->line('Your appointment has been successfully booked.')
            ->line("**Doctor:** {$doctorName}")
            ->line("**Date:** {$date}")
            ->line("**Time:** {$time}")
            ->line("**Type:** {$type}")
            ->action('View My Appointments', url('/telehealth'))
            ->line('Your appointment is pending confirmation. You will receive another notification once the doctor confirms.');
    }

    public function toArray(object $notifiable): array
    {
        $appt = $this->appointment;
        return [
            'type' => 'appointment_booked',
            'appointment_id' => $appt->id,
            'title' => $this->recipientRole === 'doctor'
                ? 'New Appointment Request'
                : 'Appointment Booked',
            'message' => $this->recipientRole === 'doctor'
                ? ($appt->patient?->fullname ?? 'A patient') . ' booked an appointment on ' . ($appt->appointment_date?->format('d M Y') ?? '') . ' at ' . $appt->appointment_time
                : 'Your appointment with ' . ($appt->doctor?->fullname ?? 'doctor') . ' on ' . ($appt->appointment_date?->format('d M Y') ?? '') . ' at ' . $appt->appointment_time . ' has been booked.',
            'doctor_id' => $appt->doctor_id,
            'patient_id' => $appt->patient_id,
            'appointment_date' => $appt->appointment_date?->toDateString(),
            'appointment_time' => $appt->appointment_time,
            'appointment_type' => $appt->appointment_type,
            'status' => 'pending',
        ];
    }
}
