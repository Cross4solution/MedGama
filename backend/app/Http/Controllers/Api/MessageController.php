<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    // ────────────────────────────────────────────────────────────
    // CONVERSATIONS
    // ────────────────────────────────────────────────────────────

    /**
     * GET /api/messages/conversations
     * List all conversations for the authenticated user.
     */
    public function conversations(Request $request)
    {
        $user = $request->user();

        $conversations = Conversation::active()
            ->forUser($user->id)
            ->with([
                'latestMessage:id,conversation_id,sender_id,body,type,created_at',
                'latestMessage.sender:id,fullname,avatar',
                'activeParticipants.user:id,fullname,avatar,role_id',
            ])
            ->withCount([
                'messages as unread_count' => function ($q) use ($user) {
                    $q->where('sender_id', '!=', $user->id)
                      ->where('is_active', true)
                      ->whereDoesntHave('readReceipts', fn($rq) => $rq->where('user_id', $user->id));
                },
            ])
            ->orderByDesc(
                Message::select('created_at')
                    ->whereColumn('conversation_id', 'conversations.id')
                    ->where('is_active', true)
                    ->orderByDesc('created_at')
                    ->limit(1)
            )
            ->paginate($request->per_page ?? 20);

        // Transform for frontend
        $conversations->getCollection()->transform(function ($conv) use ($user) {
            $participant = $conv->activeParticipants
                ->where('user_id', $user->id)
                ->first();

            return [
                'id' => $conv->id,
                'type' => $conv->type,
                'title' => $conv->title,
                'clinic_id' => $conv->clinic_id,
                'is_muted' => $participant?->is_muted ?? false,
                'is_archived' => $participant?->is_archived ?? false,
                'unread_count' => $conv->unread_count,
                'participants' => $conv->activeParticipants->map(fn($p) => [
                    'id' => $p->user->id,
                    'fullname' => $p->user->fullname,
                    'avatar' => $p->user->avatar,
                    'role_id' => $p->user->role_id,
                    'role' => $p->role,
                ]),
                'latest_message' => $conv->latestMessage ? [
                    'id' => $conv->latestMessage->id,
                    'body' => $conv->latestMessage->body,
                    'type' => $conv->latestMessage->type,
                    'sender_id' => $conv->latestMessage->sender_id,
                    'sender_name' => $conv->latestMessage->sender?->fullname,
                    'created_at' => $conv->latestMessage->created_at,
                ] : null,
                'created_at' => $conv->created_at,
                'updated_at' => $conv->updated_at,
            ];
        });

        return response()->json($conversations);
    }

    /**
     * POST /api/messages/conversations
     * Create a new conversation (direct or group).
     */
    public function createConversation(Request $request)
    {
        $request->validate([
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'uuid|exists:users,id',
            'type' => 'in:direct,group',
            'title' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $participantIds = $request->participant_ids;
        $type = $request->type ?? (count($participantIds) === 1 ? 'direct' : 'group');

        // For direct messages, check if conversation already exists
        if ($type === 'direct' && count($participantIds) === 1) {
            $conversation = Conversation::findOrCreateDirect(
                $user->id,
                $participantIds[0],
                $user->clinic_id
            );

            return response()->json([
                'conversation' => $this->formatConversation($conversation, $user->id),
                'created' => $conversation->wasRecentlyCreated,
            ], $conversation->wasRecentlyCreated ? 201 : 200);
        }

        // Group conversation
        $conversation = Conversation::create([
            'type' => 'group',
            'title' => $request->title,
            'clinic_id' => $user->clinic_id,
        ]);

        // Add creator as admin
        $conversation->participants()->create([
            'user_id' => $user->id,
            'role' => 'admin',
        ]);

        // Add other participants
        foreach ($participantIds as $pid) {
            if ($pid !== $user->id) {
                $conversation->participants()->create([
                    'user_id' => $pid,
                    'role' => 'member',
                ]);
            }
        }

        $conversation->load(['activeParticipants.user:id,fullname,avatar,role_id']);

        return response()->json([
            'conversation' => $this->formatConversation($conversation, $user->id),
        ], 201);
    }

    /**
     * GET /api/messages/conversations/{id}
     * Get a single conversation with details.
     */
    public function showConversation(Request $request, string $id)
    {
        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->with(['activeParticipants.user:id,fullname,avatar,role_id'])
            ->findOrFail($id);

        return response()->json([
            'conversation' => $this->formatConversation($conversation, $user->id),
        ]);
    }

    /**
     * PUT /api/messages/conversations/{id}
     * Update conversation (title, mute, archive).
     */
    public function updateConversation(Request $request, string $id)
    {
        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($id);

        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Update conversation title (group only, admin only)
        if ($request->has('title') && $conversation->type === 'group' && $participant->role === 'admin') {
            $conversation->update(['title' => $request->title]);
        }

        // Update participant-level settings
        if ($request->has('is_muted')) {
            $participant->update(['is_muted' => (bool) $request->is_muted]);
        }
        if ($request->has('is_archived')) {
            $participant->update(['is_archived' => (bool) $request->is_archived]);
        }

        return response()->json(['message' => 'Updated', 'conversation' => $this->formatConversation($conversation->fresh(), $user->id)]);
    }

    /**
     * DELETE /api/messages/conversations/{id}
     * Leave / soft-delete a conversation for the user.
     */
    public function deleteConversation(Request $request, string $id)
    {
        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($id);

        // Deactivate participant (soft leave)
        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['is_active' => false]);

        // If no active participants remain, deactivate the conversation
        if ($conversation->activeParticipants()->count() === 0) {
            $conversation->update(['is_active' => false]);
        }

        return response()->json(['message' => 'Conversation left']);
    }

    // ────────────────────────────────────────────────────────────
    // MESSAGES
    // ────────────────────────────────────────────────────────────

    /**
     * GET /api/messages/conversations/{conversationId}/messages
     * List messages in a conversation (paginated, newest first).
     */
    public function messages(Request $request, string $conversationId)
    {
        $user = $request->user();

        // Verify user is participant
        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($conversationId);

        $messages = $conversation->messages()
            ->active()
            ->with([
                'sender:id,fullname,avatar,role_id',
                'attachments',
                'replyTo:id,sender_id,body',
                'replyTo.sender:id,fullname',
            ])
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 50);

        // Mark conversation as read
        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        // Transform
        $messages->getCollection()->transform(fn($msg) => $this->formatMessage($msg, $user->id));

        return response()->json($messages);
    }

    /**
     * POST /api/messages/conversations/{conversationId}/messages
     * Send a message (text and/or attachments).
     */
    public function sendMessage(Request $request, string $conversationId)
    {
        $request->validate([
            'body' => 'nullable|string|max:5000',
            'type' => 'in:text,image,file,video,audio',
            'reply_to_id' => 'nullable|uuid|exists:messages,id',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:20480', // 20MB per file
        ]);

        $user = $request->user();

        // Verify user is participant
        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($conversationId);

        $hasAttachments = $request->hasFile('attachments');
        $body = $request->body;

        if (!$body && !$hasAttachments) {
            return response()->json(['message' => 'Message body or attachments required'], 422);
        }

        // Determine message type
        $type = $request->type ?? 'text';
        if ($hasAttachments && $type === 'text') {
            $firstFile = $request->file('attachments')[0];
            $mime = $firstFile->getMimeType();
            if (str_starts_with($mime, 'image/')) $type = 'image';
            elseif (str_starts_with($mime, 'video/')) $type = 'video';
            elseif (str_starts_with($mime, 'audio/')) $type = 'audio';
            else $type = 'file';
        }

        // Create message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'reply_to_id' => $request->reply_to_id,
            'body' => $body,
            'type' => $type,
        ]);

        // Handle attachments
        if ($hasAttachments) {
            foreach ($request->file('attachments') as $file) {
                $originalName = $file->getClientOriginalName();
                $path = $file->store('messages/' . $conversation->id, 'public');

                MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_name' => $originalName,
                    'file_path' => $path,
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        // Update sender's last_read_at
        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        // Load relations
        $message->load([
            'sender:id,fullname,avatar,role_id',
            'attachments',
            'replyTo:id,sender_id,body',
            'replyTo.sender:id,fullname',
        ]);

        return response()->json([
            'message' => $this->formatMessage($message, $user->id),
        ], 201);
    }

    /**
     * PUT /api/messages/{messageId}
     * Edit a message (sender only).
     */
    public function updateMessage(Request $request, string $messageId)
    {
        $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $user = $request->user();
        $message = Message::active()->where('sender_id', $user->id)->findOrFail($messageId);

        $message->update([
            'body' => $request->body,
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        return response()->json([
            'message' => $this->formatMessage($message->fresh(['sender:id,fullname,avatar,role_id', 'attachments']), $user->id),
        ]);
    }

    /**
     * DELETE /api/messages/{messageId}
     * Soft-delete a message (sender only).
     */
    public function deleteMessage(Request $request, string $messageId)
    {
        $user = $request->user();
        $message = Message::active()->where('sender_id', $user->id)->findOrFail($messageId);

        $message->update(['is_active' => false]);
        $message->delete(); // soft delete

        return response()->json(['message' => 'Message deleted']);
    }

    // ────────────────────────────────────────────────────────────
    // READ RECEIPTS
    // ────────────────────────────────────────────────────────────

    /**
     * POST /api/messages/conversations/{conversationId}/read
     * Mark all messages in a conversation as read.
     */
    public function markRead(Request $request, string $conversationId)
    {
        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($conversationId);

        // Update participant's last_read_at
        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return response()->json(['message' => 'Marked as read']);
    }

    // ────────────────────────────────────────────────────────────
    // SEARCH
    // ────────────────────────────────────────────────────────────

    /**
     * GET /api/messages/search
     * Search messages across all user's conversations.
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:200',
        ]);

        $user = $request->user();
        $query = $request->q;

        $conversationIds = ConversationParticipant::where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('conversation_id');

        $messages = Message::active()
            ->whereIn('conversation_id', $conversationIds)
            ->where('body', 'ilike', "%{$query}%")
            ->with([
                'sender:id,fullname,avatar',
                'conversation:id,type,title',
            ])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($msg) => [
                'id' => $msg->id,
                'conversation_id' => $msg->conversation_id,
                'conversation_title' => $msg->conversation->title,
                'conversation_type' => $msg->conversation->type,
                'body' => $msg->body,
                'sender_name' => $msg->sender?->fullname,
                'sender_avatar' => $msg->sender?->avatar,
                'created_at' => $msg->created_at,
            ]);

        return response()->json(['results' => $messages]);
    }

    // ────────────────────────────────────────────────────────────
    // UNREAD COUNT
    // ────────────────────────────────────────────────────────────

    /**
     * GET /api/messages/unread-count
     * Get total unread message count across all conversations.
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $participations = ConversationParticipant::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        $total = 0;
        foreach ($participations as $p) {
            $query = Message::where('conversation_id', $p->conversation_id)
                ->where('sender_id', '!=', $user->id)
                ->where('is_active', true);

            if ($p->last_read_at) {
                $query->where('created_at', '>', $p->last_read_at);
            }
            $total += $query->count();
        }

        return response()->json(['unread_count' => $total]);
    }

    // ────────────────────────────────────────────────────────────
    // HELPERS
    // ────────────────────────────────────────────────────────────

    private function formatConversation(Conversation $conv, string $userId): array
    {
        $participant = $conv->participants->where('user_id', $userId)->first()
            ?? $conv->activeParticipants->where('user_id', $userId)->first();

        return [
            'id' => $conv->id,
            'type' => $conv->type,
            'title' => $conv->title,
            'clinic_id' => $conv->clinic_id,
            'is_muted' => $participant?->is_muted ?? false,
            'is_archived' => $participant?->is_archived ?? false,
            'participants' => ($conv->activeParticipants ?? $conv->participants)->map(fn($p) => [
                'id' => $p->user->id ?? $p->user_id,
                'fullname' => $p->user->fullname ?? null,
                'avatar' => $p->user->avatar ?? null,
                'role_id' => $p->user->role_id ?? null,
                'role' => $p->role,
            ]),
            'created_at' => $conv->created_at,
            'updated_at' => $conv->updated_at,
        ];
    }

    private function formatMessage(Message $msg, string $userId): array
    {
        return [
            'id' => $msg->id,
            'conversation_id' => $msg->conversation_id,
            'sender_id' => $msg->sender_id,
            'sender' => $msg->sender ? [
                'id' => $msg->sender->id,
                'fullname' => $msg->sender->fullname,
                'avatar' => $msg->sender->avatar,
                'role_id' => $msg->sender->role_id,
            ] : null,
            'body' => $msg->body,
            'type' => $msg->type,
            'is_own' => $msg->sender_id === $userId,
            'is_edited' => $msg->is_edited,
            'edited_at' => $msg->edited_at,
            'reply_to' => $msg->replyTo ? [
                'id' => $msg->replyTo->id,
                'body' => $msg->replyTo->body,
                'sender_name' => $msg->replyTo->sender?->fullname,
            ] : null,
            'attachments' => $msg->attachments?->map(fn($a) => [
                'id' => $a->id,
                'file_name' => $a->file_name,
                'file_type' => $a->file_type,
                'file_size' => $a->file_size,
                'url' => $a->url,
                'thumb_url' => $a->thumb_url,
            ]) ?? [],
            'created_at' => $msg->created_at,
        ];
    }
}
