<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Görüntülü görüşme başlamadan hemen önce gider.
 *
 * 24 saat ve 1 saat önceki hatırlatmalar randevuyu takvime yazdırmak için;
 * ikisi de "Görüşmeye katıl" düğmesine basmak için erken. Görüntülü
 * görüşmede hastanın bağlantıya ihtiyaç duyduğu an görüşmenin başladığı
 * andır — o an gelen e-posta, kutuda yukarıda durur ve tek tıkla odaya
 * götürür.
 */
class VideoCallStartingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Appointment $appointment,
        public string $recipientRole = 'patient', // patient | doctor
    ) {}

    public function via(object $notifiable): array
    {
        // Başlamak üzere olan bir görüşmenin bildirimi kapatılabilir değil:
        // kaçırılması iki tarafın da zamanını yakıyor.
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

        // Odaya doğrudan götüren bağlantı varsa o kullanılır; yoksa kullanıcı
        // telehealth ekranına düşer ve görüşmesini oradan bulur.
        $katilimUrl = $appt->video_conference_link
            ?: config('app.frontend_url') . ($isDoctor ? '/crm/telehealth' : '/telehealth');

        return (new MailMessage)
            ->subject(trans('email.call_starting_subject', [], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.call_starting_subject', [], $locale),
                'headerTitle' => trans('email.call_starting_header', [], $locale),
                'intro'       => trans('email.call_starting_intro', ['name' => $karsiTaraf], $locale),
                'rows'        => [
                    trans('email.row_time', [], $locale)     => (string) $appt->appointment_time,
                    trans('email.row_timezone', [], $locale) => $appt->timezone ?: config('app.timezone'),
                ],
                'outro'       => trans('email.call_starting_outro', [], $locale),
                'actionUrl'   => $katilimUrl,
                'actionLabel' => trans('email.call_starting_action', [], $locale),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'video_call_starting',
            'appointment_id' => $this->appointment->id,
            'title'          => 'Your video consultation is about to start',
            'message'        => 'Your video consultation starts in a few minutes.',
            'link'           => '/telehealth',
        ];
    }
}
