<?php

namespace App\Policies;

use App\Models\ChatConversation;
use App\Models\User;

class ChatConversationPolicy
{
    /**
     * A user can only view a conversation they are part of.
     */
    public function view(User $user, ChatConversation $conversation): bool
    {
        return $conversation->hasParticipant($user->id);
    }

    /**
     * A user can only send messages to a conversation they are part of.
     */
    public function sendMessage(User $user, ChatConversation $conversation): bool
    {
        return $conversation->hasParticipant($user->id);
    }

    /**
     * A user can only mark messages as read in their own conversation.
     */
    public function markAsRead(User $user, ChatConversation $conversation): bool
    {
        return $conversation->hasParticipant($user->id);
    }
}
