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
        return (new MailMessage)
            ->subject('MedaGama — Your Verification Has Been Approved!')
            ->greeting("Congratulations, {$notifiable->fullname}!")
            ->line('Your professional verification request has been approved.')
            ->line("**Document:** {$this->verificationRequest->document_label}")
            ->line('You now have a **Verified Professional** badge on your profile, visible to all patients.')
            ->action('Go to Your Dashboard', url('/crm'))
            ->line('Thank you for being a trusted professional on MedaGama.');
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
