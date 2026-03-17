<?php

namespace App\Notifications;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class NewChatMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ChatMessage $message,
        public User $sender,
    ) {}

    /**
     * Database always + mail when the recipient has email notifications enabled.
     * Real-time delivery is handled by Laravel Broadcasting (WebSocket).
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Send email if user has email_notifications preference enabled (default true)
        $prefs = $notifiable->notification_preferences ?? [];
        $emailEnabled = $prefs['email_notifications'] ?? true;

        if ($emailEnabled && $notifiable->email) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Email representation.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';
        $senderName = $this->sender->fullname ?? 'Someone';
        $preview = $this->messagePreview();

        $subject = $locale === 'tr'
            ? "{$senderName} size yeni bir mesaj gönderdi"
            : "New message from {$senderName}";

        $greeting = $locale === 'tr'
            ? "Merhaba {$notifiable->fullname},"
            : "Hello {$notifiable->fullname},";

        $line = $locale === 'tr'
            ? "{$senderName} size bir mesaj gönderdi: \"{$preview}\""
            : "{$senderName} sent you a message: \"{$preview}\"";

        $action = $locale === 'tr' ? 'Mesajları Görüntüle' : 'View Messages';

        $url = config('app.frontend_url', config('app.url')) . '/doctor-chat';

        return (new MailMessage)
            ->subject($subject)
            ->greeting($greeting)
            ->line($line)
            ->action($action, $url)
            ->line($locale === 'tr'
                ? 'Yanıtlamak için platformumuza giriş yapın.'
                : 'Log in to our platform to reply.');
    }

    /**
     * Database notification payload.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type'            => 'new_chat_message',
            'conversation_id' => $this->message->conversation_id,
            'message_id'      => $this->message->id,
            'sender_id'       => $this->sender->id,
            'sender_name'     => $this->sender->fullname ?? 'Someone',
            'sender_avatar'   => $this->sender->avatar,
            'message_type'    => $this->message->message_type,
            'title'           => 'New message from ' . ($this->sender->fullname ?? 'Someone'),
            'body'            => $this->messagePreview(),
        ];
    }

    /**
     * Generate a short preview of the message content.
     */
    private function messagePreview(): string
    {
        return match ($this->message->message_type) {
            'image'    => '📷 Photo',
            'document' => '📎 ' . ($this->message->attachment_name ?? 'Document'),
            default    => Str::limit($this->message->content ?? '', 100),
        };
    }
}
