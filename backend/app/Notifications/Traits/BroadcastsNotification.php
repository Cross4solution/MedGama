<?php

namespace App\Notifications\Traits;

use App\Events\NewNotification;

/**
 * After a database notification is stored, broadcast it via WebSocket
 * on the user's private notifications channel.
 */
trait BroadcastsNotification
{
    /**
     * Called automatically by Laravel after the notification is sent on ALL channels.
     * We dispatch the broadcast event here so the frontend receives it in real-time.
     */
    public function afterCommit(): bool
    {
        return true;
    }

    /**
     * Hook into the "database" channel result to broadcast.
     * Called from a custom listener or manually after notify().
     */
    public static function broadcastStored(object $notifiable, array $data): void
    {
        broadcast(new NewNotification(
            userId: $notifiable->id,
            notification: $data,
        ));
    }
}
