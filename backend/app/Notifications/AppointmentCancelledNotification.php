<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment,
        public string $recipientRole = 'patient',
        public string $cancelledBy = 'system',
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

        if ($this->recipientRole === 'doctor') {
            $patientName = $appt->patient?->fullname ?? 'A patient';
            return (new MailMessage)
                ->subject('MedaGama — Appointment Cancelled')
                ->greeting("Hello, Dr. {$notifiable->fullname}")
                ->line("An appointment has been cancelled.")
                ->line("**Patient:** {$patientName}")
                ->line("**Date:** {$date}")
                ->line("**Time:** {$time}")
                ->line("**Cancelled by:** {$this->cancelledBy}")
                ->action('View Appointments', url('/crm/appointments'))
                ->line('The time slot has been released and is now available for new bookings.');
        }

        $doctorName = $appt->doctor?->fullname ?? 'Your doctor';
        return (new MailMessage)
            ->subject('MedaGama — Appointment Cancelled')
            ->greeting("Hello, {$notifiable->fullname}")
            ->line('We\'re sorry to inform you that your appointment has been cancelled.')
            ->line("**Doctor:** {$doctorName}")
            ->line("**Date:** {$date}")
            ->line("**Time:** {$time}")
            ->action('Book New Appointment', url('/telehealth-appointment'))
            ->line('If you\'d like to reschedule, please visit our platform.');
    }

    public function toArray(object $notifiable): array
    {
        $appt = $this->appointment;
        return [
            'type' => 'appointment_cancelled',
            'appointment_id' => $appt->id,
            'title' => 'Appointment Cancelled',
            'message' => $this->recipientRole === 'doctor'
                ? ($appt->patient?->fullname ?? 'A patient') . '\'s appointment on ' . ($appt->appointment_date?->format('d M Y') ?? '') . ' at ' . $appt->appointment_time . ' has been cancelled.'
                : 'Your appointment with ' . ($appt->doctor?->fullname ?? 'doctor') . ' on ' . ($appt->appointment_date?->format('d M Y') ?? '') . ' at ' . $appt->appointment_time . ' has been cancelled.',
            'doctor_id' => $appt->doctor_id,
            'patient_id' => $appt->patient_id,
            'appointment_date' => $appt->appointment_date?->toDateString(),
            'appointment_time' => $appt->appointment_time,
            'cancelled_by' => $this->cancelledBy,
            'status' => 'cancelled',
        ];
    }
}
