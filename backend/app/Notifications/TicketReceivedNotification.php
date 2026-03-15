<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(private Ticket $ticket) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';
        $isEn = $locale === 'en';

        return (new MailMessage)
            ->subject($isEn ? "Support Ticket Received — {$this->ticket->ticket_number}" : "Destek Talebiniz Alındı — {$this->ticket->ticket_number}")
            ->greeting($isEn ? "Hello {$notifiable->fullname}," : "Merhaba {$notifiable->fullname},")
            ->line($isEn
                ? "Your support ticket **{$this->ticket->ticket_number}** has been received. Our team will review it shortly."
                : "**{$this->ticket->ticket_number}** numaralı destek talebiniz alınmıştır. Ekibimiz en kısa sürede inceleyecektir.")
            ->line($isEn
                ? "**Subject:** {$this->ticket->subject}"
                : "**Konu:** {$this->ticket->subject}")
            ->line($isEn
                ? "**Priority:** " . ucfirst($this->ticket->priority)
                : "**Öncelik:** " . ucfirst($this->ticket->priority))
            ->action(
                $isEn ? 'View Ticket' : 'Talebi Görüntüle',
                config('app.frontend_url', 'http://localhost:3000') . '/crm/support'
            )
            ->line($isEn ? 'Thank you for contacting us.' : 'Bize ulaştığınız için teşekkür ederiz.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'ticket_received',
            'ticket_id'     => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'subject'       => $this->ticket->subject,
            'priority'      => $this->ticket->priority,
            'message'       => "Support ticket {$this->ticket->ticket_number} has been received.",
        ];
    }
}
