<?php

namespace App\Notifications;

use App\Channels\SmsChannel;
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
        $channels = ['database', 'mail'];

        // Add SMS channel if provider is configured and user has a phone number
        if (config('services.sms.provider', 'log') !== 'log' && $notifiable->phone) {
            $channels[] = SmsChannel::class;
        }

        return $channels;
    }

    /**
     * SMS representation (used by SmsChannel).
     */
    public function toSms(object $notifiable): array
    {
        $appt = $this->appointment;
        $timeLabel = $this->reminderType === '1h' ? '1 hour' : '24 hours';
        $date = $appt->appointment_date?->format('d M Y') ?? '';
        $time = $appt->appointment_time ?? '';

        $msg = $this->recipientRole === 'doctor'
            ? "MedGama: Appointment with {$appt->patient?->fullname} in {$timeLabel} ({$date} {$time})"
            : "MedGama: Your appointment with Dr. {$appt->doctor?->fullname} is in {$timeLabel} ({$date} {$time})";

        return [
            'to'      => $notifiable->phone,
            'message' => $msg,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appt = $this->appointment;
        $locale = $notifiable->preferred_language ?? 'en';
        $isDoctor = $this->recipientRole === 'doctor';
        $date = $appt->appointment_date?->format('d M Y') ?? $appt->appointment_date;
        $time = $appt->appointment_time;
        $isOnline = $appt->appointment_type === 'online';
        $timeLabel = $this->reminderType === '1h' ? '1 hour' : '24 hours';
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        $actionUrl = $isDoctor
            ? $frontendUrl . '/crm/appointments'
            : (($isOnline && $appt->video_conference_link) ? $appt->video_conference_link : $frontendUrl . '/telehealth');

        return (new MailMessage)
            ->subject('MedGama — ' . trans('email.appt_reminder_subject', ['time' => $timeLabel], $locale))
            ->view('emails.appointment-reminder-v2', [
                'locale'          => $locale,
                'isDoctor'        => $isDoctor,
                'userName'        => $notifiable->fullname ?? $notifiable->email,
                'counterpartName' => $isDoctor
                    ? ($appt->patient?->fullname ?? 'A patient')
                    : ($appt->doctor?->fullname ?? 'Your doctor'),
                'date'            => $date,
                'time'            => $time,
                'type'            => $appt->appointment_type ?? 'online',
                'timeLabel'       => $timeLabel,
                'isOnline'        => $isOnline,
                'videoLink'       => $appt->video_conference_link ?? '',
                'actionUrl'       => $actionUrl,
            ]);
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
