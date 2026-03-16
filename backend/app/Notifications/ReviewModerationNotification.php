<?php

namespace App\Notifications;

use App\Models\DoctorReview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReviewModerationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public DoctorReview $review,
        public string $action, // approved | rejected | hidden
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $patientName = $this->review->patient?->fullname ?? 'A patient';

        $messages = [
            'approved' => "A review by {$patientName} has been approved and is now visible on your profile.",
            'rejected' => "A review by {$patientName} has been rejected by the moderation team.",
            'hidden'   => "A review by {$patientName} has been temporarily hidden by the moderation team.",
        ];

        $titles = [
            'approved' => 'Review Approved',
            'rejected' => 'Review Rejected',
            'hidden'   => 'Review Hidden',
        ];

        return [
            'type' => 'review_' . $this->action,
            'title' => $titles[$this->action] ?? 'Review Update',
            'message' => $messages[$this->action] ?? 'A review on your profile has been updated.',
            'review_id' => $this->review->id,
            'patient_id' => $this->review->patient_id,
            'link' => '/crm/reviews',
        ];
    }
}
