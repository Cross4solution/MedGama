<?php

namespace App\Notifications;

use App\Models\DoctorReview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReviewResponseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public DoctorReview $review,
    ) {}

    public function via(object $notifiable): array
    {
        $kanallar = ['database'];

        if (\App\Support\NotificationPreferences::ister($notifiable, 'email_review_response')) {
            $kanallar[] = 'mail';
        }

        return $kanallar;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale  = $notifiable->preferred_language ?? 'en';
        $doktor  = $this->review->doctor?->fullname ?? trans('email.your_doctor', [], $locale);

        return (new MailMessage)
            ->subject(trans('email.review_response_subject', [], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.review_response_subject', [], $locale),
                'headerTitle' => trans('email.review_response_header', [], $locale),
                'intro'       => trans('email.review_response_intro', ['doctor' => $doktor], $locale),
                'quote'       => $this->review->doctor_response,
                'outro'       => trans('email.review_response_outro', [], $locale),
                'actionUrl'   => config('app.frontend_url') . '/doctors/' . $this->review->doctor_id,
                'actionLabel' => trans('email.review_response_action', [], $locale),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'review_response',
            'title' => 'Doctor Responded to Your Review',
            'message' => 'Dr. ' . ($this->review->doctor?->fullname ?? 'Your doctor') . ' responded to your review.',
            'review_id' => $this->review->id,
            'doctor_id' => $this->review->doctor_id,
            'link' => '/doctors/' . $this->review->doctor_id,
        ];
    }
}
