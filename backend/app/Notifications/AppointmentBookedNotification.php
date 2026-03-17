<?php

namespace App\Notifications;

use App\Channels\SmsChannel;
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
        $channels = ['database', 'mail'];

        if (config('services.sms.provider', 'log') !== 'log' && $notifiable->phone) {
            $channels[] = SmsChannel::class;
        }

        return $channels;
    }

    public function toSms(object $notifiable): array
    {
        $appt = $this->appointment;
        $date = $appt->appointment_date?->format('d M Y') ?? '';
        $time = $appt->appointment_time ?? '';

        $msg = $this->recipientRole === 'doctor'
            ? "MedGama: New appointment from {$appt->patient?->fullname} on {$date} at {$time}"
            : "MedGama: Your appointment with Dr. {$appt->doctor?->fullname} on {$date} at {$time} is booked.";

        return ['to' => $notifiable->phone, 'message' => $msg];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appt = $this->appointment;
        $locale = $notifiable->preferred_language ?? 'en';
        $isDoctor = $this->recipientRole === 'doctor';
        $date = $appt->appointment_date?->format('d M Y') ?? $appt->appointment_date;
        $time = $appt->appointment_time;
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        $subject = $isDoctor
            ? trans('email.appt_booked_subject_doctor', ['date' => $date], $locale)
            : trans('email.appt_booked_subject', ['date' => $date], $locale);

        return (new MailMessage)
            ->subject("MedGama — {$subject}")
            ->view('emails.appointment-booked-v2', [
                'locale'          => $locale,
                'isDoctor'        => $isDoctor,
                'userName'        => $notifiable->fullname ?? $notifiable->email,
                'counterpartName' => $isDoctor
                    ? ($appt->patient?->fullname ?? 'A patient')
                    : ($appt->doctor?->fullname ?? 'Your doctor'),
                'date'            => $date,
                'time'            => $time,
                'type'            => $appt->appointment_type ?? 'online',
                'patientNote'     => $appt->confirmation_note ?? '',
                'actionUrl'       => $isDoctor
                    ? $frontendUrl . '/crm/appointments'
                    : $frontendUrl . '/telehealth',
            ]);
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
