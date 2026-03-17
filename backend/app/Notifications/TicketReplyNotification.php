<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the ticket owner when an admin/staff replies.
 */
class TicketReplyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Ticket $ticket,
        private TicketMessage $message,
        private User $replier,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';
        $frontendUrl = config('app.frontend_url', 'https://medgama.com');

        return (new MailMessage)
            ->subject('MedGama — ' . trans('email.ticket_reply_subject', ['number' => $this->ticket->ticket_number], $locale))
            ->view('emails.ticket-reply-v2', [
                'locale'        => $locale,
                'userName'      => $notifiable->fullname ?? $notifiable->email,
                'ticketNumber'  => $this->ticket->ticket_number,
                'ticketSubject' => $this->ticket->subject,
                'replyPreview'  => \Illuminate\Support\Str::limit($this->message->body, 200),
                'actionUrl'     => $frontendUrl . '/crm/support',
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'ticket_reply',
            'ticket_id'     => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'subject'       => $this->ticket->subject,
            'replier_name'  => $this->replier->fullname,
            'title'         => "New reply on {$this->ticket->ticket_number}",
            'message'       => ($this->replier->fullname ?? 'Support') . ' replied to your ticket: ' . \Illuminate\Support\Str::limit($this->message->body, 100),
        ];
    }
}
