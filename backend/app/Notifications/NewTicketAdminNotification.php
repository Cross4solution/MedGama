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
        $locale = $notifiable->preferred_language ?? 'en';
        $user   = $this->ticket->user;

        return (new MailMessage)
            ->subject(trans('email.ticket_admin_subject', ['number' => $this->ticket->ticket_number], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.ticket_admin_subject', ['number' => $this->ticket->ticket_number], $locale),
                'headerTitle' => trans('email.ticket_admin_header', [], $locale),
                'headerIcon'  => 'chat',
                'intro'       => trans('email.ticket_admin_intro', [], $locale),
                'rows'        => [
                    trans('email.row_ticket', [], $locale)   => $this->ticket->ticket_number,
                    trans('email.row_subject', [], $locale)  => $this->ticket->subject,
                    trans('email.row_from', [], $locale)     => trim(($user->fullname ?? '-') . ' <' . ($user->email ?? '-') . '>'),
                    trans('email.row_priority', [], $locale) => ucfirst((string) $this->ticket->priority),
                ],
                'outro'       => trans('email.ticket_admin_outro', [], $locale),
                'actionUrl'   => config('app.frontend_url') . '/admin/support',
                'actionLabel' => trans('email.ticket_admin_action', [], $locale),
            ]);
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
