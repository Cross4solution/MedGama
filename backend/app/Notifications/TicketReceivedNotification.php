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
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        return (new MailMessage)
            ->subject('MedGama — ' . trans('email.ticket_received_subject', ['number' => $this->ticket->ticket_number], $locale))
            ->view('emails.ticket-received-v2', [
                'locale'         => $locale,
                'userName'       => $notifiable->fullname ?? $notifiable->email,
                'ticketNumber'   => $this->ticket->ticket_number,
                'ticketSubject'  => $this->ticket->subject,
                'ticketPriority' => $this->ticket->priority,
                'actionUrl'      => $frontendUrl . '/crm/support',
            ]);
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
