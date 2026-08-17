<?php

namespace App\Notifications;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
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
        // Sohbet mesajı yalnızca uygulama içinde bildirilir — mesajlar
        // ikisi arasında hızla gidip geldiği için her mesajda e-posta atmak
        // kısa sürede onlarca posta üretiyor ve kullanıcı tüm bildirimleri
        // kapatıyor. Zil ikonu anında yandığı için mesaj kaçmıyor.
        return ['database'];
    }

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
