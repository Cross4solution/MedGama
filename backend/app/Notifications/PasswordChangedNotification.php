<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Şifre değiştikten sonra hesap sahibine gider.
 *
 * Güvenlik bildirimi olduğu için kapatılamaz: şifreyi değiştiren kişi
 * hesabın sahibi değilse, sahibin bunu öğrenebileceği tek yer burasıdır.
 */
class PasswordChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private ?string $ip = null,
        private ?string $cihaz = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';

        $rows = [
            trans('email.row_when', [], $locale) => now()->format('d.m.Y H:i') . ' UTC',
        ];
        if ($this->ip) {
            $rows[trans('email.row_ip', [], $locale)] = $this->ip;
        }
        if ($this->cihaz) {
            $rows[trans('email.row_device', [], $locale)] = $this->cihaz;
        }

        return (new MailMessage)
            ->subject(trans('email.pwd_changed_subject', [], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.pwd_changed_subject', [], $locale),
                'headerTitle' => trans('email.pwd_changed_header', [], $locale),
                'headerIcon'  => 'lock',
                'intro'       => trans('email.pwd_changed_intro', [], $locale),
                'rows'        => $rows,
                'outro'       => trans('email.pwd_changed_outro', [], $locale),
                'actionUrl'   => config('app.frontend_url') . '/forgot-password',
                'actionLabel' => trans('email.pwd_changed_action', [], $locale),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'password_changed',
            'title'   => 'Password changed',
            'message' => 'Your account password was changed.',
            'ip'      => $this->ip,
        ];
    }
}
