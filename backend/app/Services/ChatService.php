<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Models\Appointment;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Notifications\NewChatMessageNotification;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatService
{
    // ══════════════════════════════════════════════
    //  CONVERSATIONS
    // ══════════════════════════════════════════════

    /**
     * List conversations for the authenticated user with eager-loaded relations.
     * Avoids N+1 by loading both users and the latest message in one go.
     */
    public function listConversations(string $userId, int $perPage = 20): LengthAwarePaginator
    {
        $conversations = ChatConversation::forUser($userId)
            ->where('is_active', true)
            ->with([
                'userOne:id,fullname,avatar,role_id',
                'userTwo:id,fullname,avatar,role_id',
                'lastMessageSender:id,fullname',
            ])
            ->orderByDesc('last_message_at')
            ->paginate($perPage);

        // Append unread_count efficiently with a single query
        $conversationIds = $conversations->pluck('id')->toArray();
        if ($conversationIds) {
            $unreadCounts = ChatMessage::whereIn('conversation_id', $conversationIds)
                ->where('sender_id', '!=', $userId)
                ->whereNull('read_at')
                ->selectRaw('conversation_id, count(*) as cnt')
                ->groupBy('conversation_id')
                ->pluck('cnt', 'conversation_id');

            $conversations->getCollection()->transform(function ($conv) use ($unreadCounts) {
                $conv->unread_count = $unreadCounts[$conv->id] ?? 0;
                return $conv;
            });
        }

        return $conversations;
    }

    /**
     * Find or create a 1:1 conversation between two users.
     *
     * Business rule: A patient can only start a conversation with a doctor
     * if they have at least one 'confirmed' or 'completed' appointment together.
     * Doctors, clinic owners, and admins bypass this restriction.
     *
     * @throws AuthorizationException
     */
    public function findOrCreateConversation(User $initiator, User $recipient): ChatConversation
    {
        // If a conversation already exists, return it (no need to re-check)
        [$one, $two] = strcmp($initiator->id, $recipient->id) < 0
            ? [$initiator->id, $recipient->id]
            : [$recipient->id, $initiator->id];

        $existing = ChatConversation::where('user_one_id', $one)
            ->where('user_two_id', $two)
            ->first();

        if ($existing) {
            return $existing;
        }

        // Appointment gate: patient ↔ doctor requires a confirmed/completed appointment
        $this->verifyAppointmentRelationship($initiator, $recipient);

        return ChatConversation::findOrCreateBetween($initiator->id, $recipient->id);
    }

    /**
     * Verify that a patient-doctor pair has at least one confirmed/completed appointment.
     * Admins and doctor/clinicOwner initiators bypass this check.
     *
     * @throws AuthorizationException
     */
    private function verifyAppointmentRelationship(User $initiator, User $recipient): void
    {
        // Admins, doctors, and clinic owners can start conversations freely
        if ($initiator->isAdmin() || $initiator->isDoctor() || $initiator->isClinicOwner()) {
            return;
        }

        // Only enforce when a patient is reaching out to a doctor
        if (!($initiator->isPatient() && $recipient->isDoctor())) {
            return;
        }

        $hasAppointment = Appointment::where('patient_id', $initiator->id)
            ->where('doctor_id', $recipient->id)
            ->whereIn('status', ['confirmed', 'completed'])
            ->exists();

        if (!$hasAppointment) {
            throw new AuthorizationException(
                'You need a confirmed or completed appointment with this doctor before starting a conversation.'
            );
        }
    }

    // ══════════════════════════════════════════════
    //  MESSAGES
    // ══════════════════════════════════════════════

    /**
     * List messages for a conversation (newest first), with sender eager-loaded.
     */
    public function listMessages(ChatConversation $conversation, int $perPage = 30): LengthAwarePaginator
    {
        return $conversation->messages()
            ->with('sender:id,fullname,avatar')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Send a message in a conversation.
     * Handles text and file attachments, broadcasts the event.
     */
    public function sendMessage(
        ChatConversation $conversation,
        User $sender,
        array $data,
        ?UploadedFile $attachment = null,
    ): ChatMessage {
        $messageType = $data['message_type'] ?? 'text';
        $attachmentUrl = null;
        $attachmentName = null;

        // Handle file attachment
        if ($attachment) {
            $messageType = $this->detectMessageType($attachment);
            $folder = 'chat/attachments/' . $conversation->id;
            $filename = Str::uuid() . '.' . ($attachment->getClientOriginalExtension() ?: 'bin');
            $attachment->storeAs($folder, $filename, 'public');
            $attachmentUrl = asset('storage/' . $folder . '/' . $filename);
            $attachmentName = $attachment->getClientOriginalName();
        }

        $contentPreview = $data['content'] ?? null;

        $message = DB::transaction(function () use ($conversation, $sender, $data, $messageType, $attachmentUrl, $attachmentName, $contentPreview) {
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id'       => $sender->id,
                'message_type'    => $messageType,
                'content'         => $contentPreview,
                'attachment_url'  => $attachmentUrl,
                'attachment_name' => $attachmentName,
            ]);

            // Denormalize last message into conversation (no subquery needed on list)
            $conversation->update([
                'last_message_at'        => now(),
                'last_message_content'   => Str::limit($contentPreview ?? $attachmentName ?? '', 255),
                'last_message_type'      => $messageType,
                'last_message_sender_id' => $sender->id,
            ]);

            return $message;
        });

        $message->load('sender:id,fullname,avatar');

        // Broadcast to the private channel (real-time WebSocket)
        broadcast(new MessageSent($message))->toOthers();

        // Push notification to the recipient (queued — FCM / database)
        $this->notifyRecipient($conversation, $sender, $message);

        return $message;
    }

    /**
     * Mark all unread messages in a conversation as read for the given user.
     */
    public function markAsRead(ChatConversation $conversation, string $userId): int
    {
        return ChatMessage::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Get total unread message count across all conversations for a user.
     */
    public function totalUnreadCount(string $userId): int
    {
        $conversationIds = ChatConversation::forUser($userId)
            ->where('is_active', true)
            ->pluck('id');

        if ($conversationIds->isEmpty()) {
            return 0;
        }

        return ChatMessage::whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->count();
    }

    // ══════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ══════════════════════════════════════════════

    /**
     * Detect message_type from the uploaded file's MIME type.
     */
    private function detectMessageType(UploadedFile $file): string
    {
        $mime = $file->getMimeType() ?? '';

        if (str_starts_with($mime, 'image/')) {
            return 'image';
        }

        return 'document';
    }

    /**
     * Send a push notification to the recipient (queued).
     */
    private function notifyRecipient(ChatConversation $conversation, User $sender, ChatMessage $message): void
    {
        try {
            $recipientId = $conversation->otherUserId($sender->id);
            $recipient = User::find($recipientId);

            if ($recipient) {
                $recipient->notify(new NewChatMessageNotification($message, $sender));
            }
        } catch (\Throwable $e) {
            \Log::warning('Chat push notification failed', [
                'conversation_id' => $conversation->id,
                'error'           => $e->getMessage(),
            ]);
        }
    }
}
