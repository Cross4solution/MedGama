<?php

namespace App\Notifications;

use App\Models\DoctorReview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewReviewNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public DoctorReview $review,
    ) {}

    public function via(object $notifiable): array
    {
        // Uygulama içi her zaman düşer; e-posta kullanıcının tercihine bağlı.
        $kanallar = ['database'];

        if (\App\Support\NotificationPreferences::ister($notifiable, 'email_review_received')) {
            $kanallar[] = 'mail';
        }

        return $kanallar;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';
        $hasta  = $this->review->patient?->fullname ?? trans('email.a_patient', [], $locale);

        return (new MailMessage)
            ->subject(trans('email.new_review_subject', [], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.new_review_subject', [], $locale),
                'headerTitle' => trans('email.new_review_header', [], $locale),
                'intro'       => trans('email.new_review_intro', ['name' => $hasta, 'rating' => $this->review->rating], $locale),
                'quote'       => $this->review->comment ?: null,
                'outro'       => trans('email.new_review_outro', [], $locale),
                'actionUrl'   => config('app.frontend_url') . '/crm/reviews',
                'actionLabel' => trans('email.new_review_action', [], $locale),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_review',
            'title' => 'New Patient Review',
            'message' => ($this->review->patient?->fullname ?? 'A patient') . ' left a ' . $this->review->rating . '-star review on your profile.',
            'review_id' => $this->review->id,
            'patient_id' => $this->review->patient_id,
            'rating' => $this->review->rating,
            'link' => '/crm/reviews',
        ];
    }
}
