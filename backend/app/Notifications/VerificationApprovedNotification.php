<?php

namespace App\Notifications;

use App\Models\VerificationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerificationApprovedNotification extends Notification implements ShouldQueue
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
        $locale = $notifiable->preferred_language ?? 'en';
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        return (new MailMessage)
            ->subject('MedGama — ' . trans('email.verify_approved_subject', [], $locale))
            ->view('emails.verification-approved-v2', [
                'locale'        => $locale,
                'userName'      => $notifiable->fullname ?? $notifiable->email,
                'documentLabel' => $this->verificationRequest->document_label,
                'actionUrl'     => $frontendUrl . '/crm',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'verification_approved',
            'title' => 'Verification Approved',
            'message' => 'Your professional verification has been approved. You now have a Verified badge.',
            'verification_request_id' => $this->verificationRequest->id,
            'document_type' => $this->verificationRequest->document_type,
            'document_label' => $this->verificationRequest->document_label,
        ];
    }
}
