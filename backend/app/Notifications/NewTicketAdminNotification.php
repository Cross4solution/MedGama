<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to all superAdmin/saasAdmin users when a new support ticket is created.
 */
class NewTicketAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private Ticket $ticket) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $user = $this->ticket->user;

        return (new MailMessage)
            ->subject("New Support Ticket — {$this->ticket->ticket_number}")
            ->greeting("Hello {$notifiable->fullname},")
            ->line("A new support ticket has been submitted.")
            ->line("**Ticket:** {$this->ticket->ticket_number}")
            ->line("**Subject:** {$this->ticket->subject}")
            ->line("**From:** " . ($user->fullname ?? 'Unknown') . " ({$user->email})")
            ->line("**Priority:** " . ucfirst($this->ticket->priority))
            ->action('View Ticket', config('app.frontend_url', 'http://localhost:3000') . '/admin/support')
            ->line('Please review and respond as soon as possible.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'new_ticket_admin',
            'ticket_id'     => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'subject'       => $this->ticket->subject,
            'priority'      => $this->ticket->priority,
            'user_name'     => $this->ticket->user->fullname ?? 'Unknown',
            'title'         => "New Support Ticket {$this->ticket->ticket_number}",
            'message'       => ($this->ticket->user->fullname ?? 'A user') . " submitted ticket: {$this->ticket->subject}",
        ];
    }
}
