<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $userName = 'User',
        ?string $dil = null,
    ) {
        // Laravel'in kendi yerelleştirmesi: gönderim boyunca uygulama diline
        // geçiyor, böylece hem konu satırı hem gövde alıcının dilinde kuruluyor
        // ve şablona ayrıca dil taşımak gerekmiyor.
        // ($locale adı Mailable'da zaten var, üzerine yazılamaz.)
        $this->locale($dil ?: config('app.locale'));
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: trans('email.pwd_reset_subject'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset',
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
