<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clinic;
use App\Models\ContactMessage;
use App\Models\ContactMessageAttachment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContactMessageController extends Controller
{
    private static array $allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    /**
     * POST /api/contact-messages
     * Patient sends a message to a clinic or doctor (with optional attachments).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'receiver_id'   => 'required|uuid',
            'receiver_type'  => 'required|string|in:clinic,doctor',
            'subject'        => 'nullable|string|max:255',
            'body'           => 'required|string|max:5000',
            'attachments'    => 'nullable|array|max:5',
            'attachments.*'  => 'file|max:5120', // 5 MB per file
        ]);

        $user         = $request->user();
        $receiverType = $request->input('receiver_type');
        $receiverId   = $request->input('receiver_id');

        // Validate receiver exists
        if ($receiverType === 'clinic') {
            Clinic::findOrFail($receiverId);
        } else {
            User::where('role_id', 'doctor')->where('is_active', true)->findOrFail($receiverId);
        }

        // Create message
        $message = ContactMessage::create([
            'sender_id'     => $user->id,
            'receiver_id'   => $receiverId,
            'receiver_type' => $receiverType,
            'subject'       => $request->input('subject'),
            'body'          => $request->input('body'),
        ]);

        // Handle attachments
        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $mime = $file->getMimeType();
                if (!in_array($mime, self::$allowedMimes, true)) {
                    continue; // skip disallowed types silently
                }

                $ext      = $file->getClientOriginalExtension() ?: 'bin';
                $filename = Str::uuid() . '.' . $ext;
                $path     = $file->storeAs('contact-messages/' . $message->id, $filename, 'public');

                $attachments[] = ContactMessageAttachment::create([
                    'contact_message_id' => $message->id,
                    'file_name'          => $file->getClientOriginalName(),
                    'file_path'          => $path,
                    'mime_type'          => $mime,
                    'file_size'          => $file->getSize(),
                ]);
            }
        }

        AuditLog::log(
            action: 'contact_message.sent',
            resourceType: 'ContactMessage',
            resourceId: $message->id,
            newValues: [
                'receiver_type' => $receiverType,
                'receiver_id'   => $receiverId,
                'has_attachments' => count($attachments) > 0,
            ],
            description: "{$user->fullname} sent a contact message to {$receiverType}:{$receiverId}",
        );

        $message->load('attachments');

        return response()->json([
            'message'  => 'Message sent successfully.',
            'data'     => $this->formatMessage($message),
        ], 201);
    }

    /**
     * GET /api/contact-messages/inbox
     * Inbox for clinic owner / doctor — list received contact messages.
     */
    public function inbox(Request $request): JsonResponse
    {
        $user    = $request->user();
        $role    = $user->role_id;
        $perPage = min((int) ($request->query('per_page') ?? 20), 50);

        // Determine receiver scope
        $query = ContactMessage::query()->with(['sender:id,fullname,avatar,email', 'attachments']);

        if ($role === 'clinicOwner' || $role === 'clinic') {
            // Show messages sent to any clinic owned by this user
            $clinicIds = Clinic::where('owner_id', $user->id)->pluck('id')->toArray();
            if (empty($clinicIds)) {
                return response()->json(['data' => [], 'meta' => ['total' => 0]]);
            }
            $query->where('receiver_type', 'clinic')->whereIn('receiver_id', $clinicIds);
        } elseif ($role === 'doctor') {
            $query->where('receiver_type', 'doctor')->where('receiver_id', $user->id);
        } else {
            // superAdmin — see all
        }

        // Filters
        if ($request->has('unread_only') && $request->boolean('unread_only')) {
            $query->unread();
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'ilike', "%{$search}%")
                  ->orWhere('body', 'ilike', "%{$search}%");
            });
        }

        $messages = $query->orderByDesc('created_at')->paginate($perPage);

        $data = $messages->through(fn($msg) => $this->formatMessage($msg));

        return response()->json($data);
    }

    /**
     * GET /api/contact-messages/{id}
     * Show single message + mark as read.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $message = ContactMessage::with(['sender:id,fullname,avatar,email', 'attachments'])->findOrFail($id);

        // Mark as read
        if (!$message->is_read) {
            $message->update(['is_read' => true, 'read_at' => now()]);
        }

        return response()->json(['data' => $this->formatMessage($message)]);
    }

    /**
     * DELETE /api/contact-messages/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $message = ContactMessage::findOrFail($id);

        // Delete attachment files
        foreach ($message->attachments as $att) {
            Storage::disk('public')->delete($att->file_path);
        }

        $message->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * GET /api/contact-messages/{id}/download/{attachmentId}
     * Download a specific attachment.
     */
    public function downloadAttachment(Request $request, string $id, string $attachmentId)
    {
        $message    = ContactMessage::findOrFail($id);
        $attachment = ContactMessageAttachment::where('contact_message_id', $message->id)->findOrFail($attachmentId);

        $disk = Storage::disk('public');
        if (!$disk->exists($attachment->file_path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return $disk->download($attachment->file_path, $attachment->file_name);
    }

    /**
     * GET /api/contact-messages/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role_id;

        $query = ContactMessage::unread();

        if ($role === 'clinicOwner' || $role === 'clinic') {
            $clinicIds = Clinic::where('owner_id', $user->id)->pluck('id')->toArray();
            $query->where('receiver_type', 'clinic')->whereIn('receiver_id', $clinicIds);
        } elseif ($role === 'doctor') {
            $query->where('receiver_type', 'doctor')->where('receiver_id', $user->id);
        }

        return response()->json(['count' => $query->count()]);
    }

    // ── Helper ──

    private function formatMessage(ContactMessage $msg): array
    {
        return [
            'id'            => $msg->id,
            'sender'        => $msg->sender ? [
                'id'       => $msg->sender->id,
                'fullname' => $msg->sender->fullname,
                'avatar'   => $msg->sender->avatar,
                'email'    => $msg->sender->email,
            ] : null,
            'receiver_id'   => $msg->receiver_id,
            'receiver_type' => $msg->receiver_type,
            'subject'       => $msg->subject,
            'body'          => $msg->body,
            'is_read'       => $msg->is_read,
            'read_at'       => $msg->read_at?->toISOString(),
            'attachments'   => $msg->attachments->map(fn($a) => [
                'id'        => $a->id,
                'file_name' => $a->file_name,
                'file_path' => '/storage/' . $a->file_path,
                'mime_type' => $a->mime_type,
                'file_size' => $a->file_size,
            ]),
            'created_at'    => $msg->created_at?->toISOString(),
        ];
    }
}
