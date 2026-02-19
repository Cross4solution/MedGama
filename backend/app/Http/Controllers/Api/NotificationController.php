<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NotificationController extends Controller
{
    #[OA\Get(
        path: '/notifications',
        summary: 'List notifications (paginated, filterable)',
        security: [['sanctum' => []]],
        tags: ['Notifications'],
        parameters: [
            new OA\Parameter(name: 'unread', in: 'query', schema: new OA\Schema(type: 'boolean'), description: 'Filter unread only'),
            new OA\Parameter(name: 'type', in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by notification type'),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated notifications'),
        ]
    )]
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

    #[OA\Get(
        path: '/notifications/unread-count',
        summary: 'Get unread notification count',
        security: [['sanctum' => []]],
        tags: ['Notifications'],
        responses: [
            new OA\Response(response: 200, description: 'Unread count'),
        ]
    )]
    public function unreadCount(Request $request)
    {
        $count = $request->user()->unreadNotifications()->count();

        return response()->json(['unread_count' => $count]);
    }

    #[OA\Put(
        path: '/notifications/{id}/read',
        summary: 'Mark single notification as read',
        security: [['sanctum' => []]],
        tags: ['Notifications'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Notification marked as read'),
        ]
    )]
    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    #[OA\Put(
        path: '/notifications/read-all',
        summary: 'Mark all notifications as read',
        security: [['sanctum' => []]],
        tags: ['Notifications'],
        responses: [
            new OA\Response(response: 200, description: 'All notifications marked as read'),
        ]
    )]
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    #[OA\Delete(
        path: '/notifications/{id}',
        summary: 'Delete single notification',
        security: [['sanctum' => []]],
        tags: ['Notifications'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Notification deleted'),
        ]
    )]
    public function destroy(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }

    #[OA\Delete(
        path: '/notifications',
        summary: 'Delete all read notifications',
        security: [['sanctum' => []]],
        tags: ['Notifications'],
        responses: [
            new OA\Response(response: 200, description: 'Read notifications cleared'),
        ]
    )]
    public function destroyAll(Request $request)
    {
        $request->user()
            ->notifications()
            ->whereNotNull('read_at')
            ->delete();

        return response()->json(['message' => 'Read notifications cleared.']);
    }
}
