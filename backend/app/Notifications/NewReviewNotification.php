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
        $patientName = $this->review->patient?->fullname ?? 'A patient';
        $rating = $this->review->rating;

        return (new MailMessage)
            ->subject('MedaGama — New Patient Review')
            ->greeting("Hello, Dr. {$notifiable->fullname}!")
            ->line("{$patientName} has left a **{$rating}-star** review on your profile.")
            ->line($this->review->comment ? "**Comment:** \"{$this->review->comment}\"" : '')
            ->action('View Your Reviews', url('/crm/reviews'))
            ->line('You can respond to this review from your CRM dashboard.');
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
