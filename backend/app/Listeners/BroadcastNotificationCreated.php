<?php

namespace App\Listeners;

use App\Events\NewNotification;
use Illuminate\Notifications\Events\NotificationSent;

/**
 * Whenever a database notification is persisted, broadcast it via WebSocket
 * so the frontend receives it in real-time on the user's private channel.
 */
class BroadcastNotificationCreated
{
    public function handle(NotificationSent $event): void
    {
        // Only act on notifications stored in the database channel
        if ($event->channel !== 'database') {
            return;
        }

        $notifiable = $event->notifiable;
        $data = method_exists($event->notification, 'toArray')
            ? $event->notification->toArray($notifiable)
            : ($event->response ?? []);

        // Find the just-created database notification record to get its UUID
        $dbNotif = $notifiable->notifications()
            ->latest()
            ->first();

        $payload = [
            'id'         => $dbNotif?->id,
            'type'       => $data['type'] ?? class_basename($event->notification),
            'data'       => $data,
            'read_at'    => null,
            'created_at' => $dbNotif?->created_at?->toISOString() ?? now()->toISOString(),
        ];

        broadcast(new NewNotification(
            userId: $notifiable->id,
            notification: $payload,
        ));
    }
}
