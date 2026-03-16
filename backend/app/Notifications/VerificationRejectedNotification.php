<?php

namespace App\Notifications;

use App\Models\VerificationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerificationRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public VerificationRequest $verificationRequest,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('MedaGama — Verification Request Update')
            ->greeting("Hello, {$notifiable->fullname}")
            ->line('Unfortunately, your verification request could not be approved at this time.')
            ->line("**Document:** {$this->verificationRequest->document_label}");

        if ($this->verificationRequest->rejection_reason) {
            $mail->line("**Reason:** {$this->verificationRequest->rejection_reason}");
        }

        return $mail
            ->line('You can upload corrected documents and resubmit your verification request.')
            ->action('Upload New Documents', url('/crm/settings'))
            ->line('If you have questions, please contact our support team.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'verification_rejected',
            'title' => 'Verification Rejected',
            'message' => 'Your verification request was not approved.' .
                ($this->verificationRequest->rejection_reason
                    ? ' Reason: ' . $this->verificationRequest->rejection_reason
                    : ''),
            'verification_request_id' => $this->verificationRequest->id,
            'document_type' => $this->verificationRequest->document_type,
            'document_label' => $this->verificationRequest->document_label,
            'rejection_reason' => $this->verificationRequest->rejection_reason,
        ];
    }
}
