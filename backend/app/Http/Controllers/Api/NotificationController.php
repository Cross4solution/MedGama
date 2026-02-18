<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * List notifications for the authenticated user (paginated).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = $user->notifications();

        // Optional filter: unread only
        if ($request->boolean('unread')) {
            $query = $user->unreadNotifications();
        }

        // Optional filter: by type (e.g. appointment_booked, appointment_reminder)
        if ($request->filled('type')) {
            $query->whereJsonContains('data->type', $request->type);
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($notifications);
    }

    /**
     * GET /api/notifications/unread-count
     */
    public function unreadCount(Request $request)
    {
        $count = $request->user()->unreadNotifications()->count();

        return response()->json(['unread_count' => $count]);
    }

    /**
     * PUT /api/notifications/{id}/read
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * DELETE /api/notifications/{id}
     */
    public function destroy(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }

    /**
     * DELETE /api/notifications
     * Delete all read notifications.
     */
    public function destroyAll(Request $request)
    {
        $request->user()
            ->notifications()
            ->whereNotNull('read_at')
            ->delete();

        return response()->json(['message' => 'Read notifications cleared.']);
    }
}
