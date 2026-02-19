<?php

use App\Models\ChatConversation;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Register all of the event broadcasting channels that your application
| supports. The given channel authorization callbacks are used to check
| if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('chat.{conversationId}', function ($user, string $conversationId) {
    $conversation = ChatConversation::find($conversationId);

    return $conversation && $conversation->hasParticipant($user->id);
});
