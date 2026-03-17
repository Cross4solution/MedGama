<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $role = 'patient', // patient | doctor
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';
        $isDoctor = in_array($this->role, ['doctor', 'clinicOwner']);
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        return (new MailMessage)
            ->subject(trans('email.welcome_subject', [], $locale))
            ->view('emails.welcome', [
                'locale'    => $locale,
                'userName'  => $notifiable->fullname ?? $notifiable->email,
                'isDoctor'  => $isDoctor,
                'actionUrl' => $isDoctor ? $frontendUrl . '/crm' : $frontendUrl,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'    => 'welcome',
            'title'   => 'Welcome to MedGama',
            'message' => 'Welcome aboard, ' . ($notifiable->fullname ?? 'User') . '! Your account has been created successfully.',
        ];
    }
}
