<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $userName = 'User',
        ?string $dil = null,
    ) {
        // Gönderim boyunca alıcının diline geçilir; konu ve gövde birlikte
        // çevrilir. ($locale adı Mailable'da zaten kullanılıyor.)
        $this->locale($dil ?: config('app.locale'));
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: trans('email.verify_code_subject'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verification-code',
            with: [
                'code' => $this->code,
                'name' => $this->userName,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
