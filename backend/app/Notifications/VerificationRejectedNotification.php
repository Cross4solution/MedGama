<?php

namespace App\Notifications;

use App\Models\VerificationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class VerificationRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public VerificationRequest $verificationRequest,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        return (new MailMessage)
            ->subject('MedGama — ' . trans('email.verify_rejected_subject', [], $locale))
            ->view('emails.verification-rejected-v2', [
                'locale'          => $locale,
                'userName'        => $notifiable->fullname ?? $notifiable->email,
                'documentLabel'   => $this->verificationRequest->document_label,
                'rejectionReason' => $this->verificationRequest->rejection_reason ?? '',
                'actionUrl'       => $frontendUrl . '/crm/settings',
            ]);
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

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'verification_rejected',
            'title' => 'Verification Rejected',
            'message' => 'Your verification request was not approved.' .
                ($this->verificationRequest->rejection_reason
                    ? ' Reason: ' . $this->verificationRequest->rejection_reason
                    : ''),
            'verification_status' => 'rejected',
            'admin_verification_note' => null,
            'action_url' => '/crm/settings?tab=verification',
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function broadcastOn(): array
    {
        return ["user.{$this->verificationRequest->doctor_id}"];
    }
}
