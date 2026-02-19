<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id'       => $this->sender_id,
            'message_type'    => $this->message_type,
            'content'         => $this->content,
            'attachment_url'  => $this->attachment_url,
            'attachment_name' => $this->attachment_name,
            'read_at'         => $this->read_at?->toISOString(),
            'created_at'      => $this->created_at?->toISOString(),
            'updated_at'      => $this->updated_at?->toISOString(),

            'sender' => $this->whenLoaded('sender', fn () => [
                'id'       => $this->sender->id,
                'fullname' => $this->sender->fullname,
                'avatar'   => $this->sender->avatar,
            ]),
        ];
    }
}
