<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $authId = $request->user()?->id;

        return [
            'id'              => $this->id,
            'user_one_id'     => $this->user_one_id,
            'user_two_id'     => $this->user_two_id,
            'last_message_at'      => $this->last_message_at?->toISOString(),
            'last_message_content' => $this->last_message_content,
            'last_message_type'    => $this->last_message_type,
            'created_at'           => $this->created_at?->toISOString(),

            // The other participant (eager-loaded)
            'other_user' => $this->when($authId, function () use ($authId) {
                $other = $this->user_one_id === $authId
                    ? $this->whenLoaded('userTwo')
                    : $this->whenLoaded('userOne');

                if (!$other || $other instanceof \Illuminate\Http\Resources\MissingValue) {
                    return null;
                }

                return [
                    'id'       => $other->id,
                    'fullname' => $other->fullname,
                    'avatar'   => $other->avatar,
                    'role_id'  => $other->role_id,
                ];
            }),

            'last_message_sender' => $this->whenLoaded('lastMessageSender', fn () => [
                'id'       => $this->lastMessageSender->id,
                'fullname' => $this->lastMessageSender->fullname,
            ]),

            'unread_count' => $this->unread_count ?? 0,
        ];
    }
}
