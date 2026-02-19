<?php

namespace App\Events;

use App\Http\Resources\ChatMessageResource;
use App\Models\ChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMessage $message,
    ) {
        $this->message->loadMissing('sender:id,fullname,avatar');
    }

    /**
     * Broadcast on a private channel scoped to the conversation.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->message->conversation_id),
        ];
    }

    /**
     * Data sent to the frontend via WebSocket.
     */
    public function broadcastWith(): array
    {
        return (new ChatMessageResource($this->message))->resolve();
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
