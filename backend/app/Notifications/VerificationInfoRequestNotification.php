<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use App\Models\VerificationRequest;

class VerificationInfoRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public VerificationRequest $verificationRequest,
        public string $message
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';

        return (new MailMessage)
            ->subject(trans('email.verify_info_subject', [], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.verify_info_subject', [], $locale),
                'headerTitle' => trans('email.verify_info_header', [], $locale),
                'intro'       => trans('email.verify_info_intro', [], $locale),
                'quote'       => $this->message,
                'outro'       => trans('email.verify_info_outro', [], $locale),
                'actionUrl'   => config('app.frontend_url') . '/crm/settings?tab=verification',
                'actionLabel' => trans('email.verify_info_action', [], $locale),
            ]);
    }

    /**
     * Get the array representation of the notification (for database).
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'verification_info_requested',
            'title' => 'Additional Documents Needed',
            'message' => $this->message,
            'verification_request_id' => $this->verificationRequest->id,
            'document_type' => $this->verificationRequest->document_type,
            'action_url' => '/crm/settings?tab=verification',
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'verification_info_requested',
            'title' => 'Additional Documents Needed',
            'message' => $this->message,
            'verification_status' => 'info_requested',
            'admin_verification_note' => $this->message,
            'action_url' => '/crm/settings?tab=verification',
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return ["user.{$this->verificationRequest->doctor_id}"];
    }
}
