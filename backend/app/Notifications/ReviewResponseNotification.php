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
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $doctorName = $this->review->doctor?->fullname ?? 'Your doctor';

        return (new MailMessage)
            ->subject('MedaGama — Doctor Responded to Your Review')
            ->greeting("Hello, {$notifiable->fullname}!")
            ->line("Dr. {$doctorName} has responded to your review.")
            ->line("**Doctor's Response:** \"{$this->review->doctor_response}\"")
            ->action('View Review', url('/doctors/' . $this->review->doctor_id))
            ->line('Thank you for sharing your experience on MedaGama.');
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
