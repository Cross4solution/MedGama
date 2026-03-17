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
        $locale = $notifiable->preferred_language ?? 'en';
        $isDoctor = $this->recipientRole === 'doctor';
        $date = $appt->appointment_date?->format('d M Y') ?? $appt->appointment_date;
        $time = $appt->appointment_time;
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        return (new MailMessage)
            ->subject('MedGama — ' . trans('email.appt_cancelled_subject', [], $locale))
            ->view('emails.appointment-cancelled-v2', [
                'locale'          => $locale,
                'isDoctor'        => $isDoctor,
                'userName'        => $notifiable->fullname ?? $notifiable->email,
                'counterpartName' => $isDoctor
                    ? ($appt->patient?->fullname ?? 'A patient')
                    : ($appt->doctor?->fullname ?? 'Your doctor'),
                'date'            => $date,
                'time'            => $time,
                'cancelledBy'     => $this->cancelledBy,
                'actionUrl'       => $isDoctor
                    ? $frontendUrl . '/crm/appointments'
                    : $frontendUrl . '/telehealth-appointment',
            ]);
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
