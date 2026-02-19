<?php

namespace App\Http\Controllers\Api;

use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Resources\ChatConversationResource;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatConversation;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;

class ChatController extends Controller
{
    public function __construct(
        private readonly ChatService $chatService,
    ) {}

    // ── Conversations ──

    #[OA\Get(
        path: '/chat/conversations',
        summary: 'List conversations (denormalized last_message, unread_count)',
        security: [['sanctum' => []]],
        tags: ['Chat'],
        parameters: [
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated conversations with other_user, last_message, unread_count'),
        ]
    )]
    public function conversations(Request $request): AnonymousResourceCollection
    {
        $conversations = $this->chatService->listConversations(
            $request->user()->id,
            (int) $request->input('per_page', 20),
        );

        return ChatConversationResource::collection($conversations);
    }

    #[OA\Post(
        path: '/chat/conversations',
        summary: 'Start or retrieve a 1:1 conversation',
        description: 'Business Rule: A patient can only start a conversation with a doctor if they have at least one confirmed/completed appointment together. Doctors, clinic owners, and admins bypass this restriction.',
        security: [['sanctum' => []]],
        tags: ['Chat'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['recipient_id'],
                properties: [
                    new OA\Property(property: 'recipient_id', type: 'string', format: 'uuid'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Existing conversation returned'),
            new OA\Response(response: 201, description: 'New conversation created'),
            new OA\Response(response: 403, description: 'No confirmed/completed appointment with this doctor', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function startConversation(Request $request): JsonResponse
    {
        $request->validate([
            'recipient_id' => 'required|uuid|exists:users,id',
        ]);

        $recipient = \App\Models\User::findOrFail($request->input('recipient_id'));

        // Service checks appointment requirement for patient → doctor conversations
        $conversation = $this->chatService->findOrCreateConversation(
            $request->user(),
            $recipient,
        );

        $conversation->load([
            'userOne:id,fullname,avatar,role_id',
            'userTwo:id,fullname,avatar,role_id',
        ]);

        return (new ChatConversationResource($conversation))
            ->response()
            ->setStatusCode($conversation->wasRecentlyCreated ? 201 : 200);
    }

    // ── Messages ──

    #[OA\Get(
        path: '/chat/conversations/{conversation}/messages',
        summary: 'List messages (newest first, sender eager-loaded)',
        security: [['sanctum' => []]],
        tags: ['Chat'],
        parameters: [
            new OA\Parameter(name: 'conversation', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 30)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated messages (ChatMessageResource)'),
            new OA\Response(response: 403, description: 'Not a participant'),
        ]
    )]
    public function messages(ChatConversation $conversation, Request $request): AnonymousResourceCollection
    {
        $this->authorize('view', $conversation);

        $messages = $this->chatService->listMessages(
            $conversation,
            (int) $request->input('per_page', 30),
        );

        return ChatMessageResource::collection($messages);
    }

    #[OA\Post(
        path: '/chat/conversations/{conversation}/messages',
        summary: 'Send message (text or file). Broadcasts message.sent event via WebSocket.',
        security: [['sanctum' => []]],
        tags: ['Chat'],
        parameters: [
            new OA\Parameter(name: 'conversation', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: 'content', type: 'string', description: 'Required if no attachment'),
                        new OA\Property(property: 'attachment', type: 'string', format: 'binary', description: 'Image or document, max 20MB. Type auto-detected from MIME.'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Message sent (ChatMessageResource)'),
            new OA\Response(response: 403, description: 'Not a participant'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function sendMessage(SendMessageRequest $request, ChatConversation $conversation): JsonResponse
    {
        $this->authorize('sendMessage', $conversation);

        $message = $this->chatService->sendMessage(
            $conversation,
            $request->user(),
            $request->validated(),
            $request->file('attachment'),
        );

        return (new ChatMessageResource($message))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Post(
        path: '/chat/conversations/{conversation}/read',
        summary: 'Bulk mark all unread messages as read (single UPDATE query)',
        security: [['sanctum' => []]],
        tags: ['Chat'],
        parameters: [
            new OA\Parameter(name: 'conversation', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Messages marked as read with count'),
        ]
    )]
    public function markAsRead(ChatConversation $conversation, Request $request): JsonResponse
    {
        $this->authorize('markAsRead', $conversation);

        $count = $this->chatService->markAsRead($conversation, $request->user()->id);

        return response()->json([
            'message' => 'Messages marked as read.',
            'count'   => $count,
        ]);
    }

    #[OA\Get(
        path: '/chat/unread-count',
        summary: 'Total unread message count across all conversations',
        security: [['sanctum' => []]],
        tags: ['Chat'],
        responses: [
            new OA\Response(response: 200, description: 'Unread count'),
        ]
    )]
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->chatService->totalUnreadCount($request->user()->id);

        return response()->json(['unread_count' => $count]);
    }

    // ── Typing Indicator ──

    #[OA\Post(
        path: '/chat/conversations/{conversation}/typing',
        summary: 'Broadcast typing indicator via WebSocket (user.typing event)',
        security: [['sanctum' => []]],
        tags: ['Chat'],
        parameters: [
            new OA\Parameter(name: 'conversation', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'is_typing', type: 'boolean', default: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Typing indicator broadcast'),
        ]
    )]
    public function typing(ChatConversation $conversation, Request $request): JsonResponse
    {
        $this->authorize('sendMessage', $conversation);

        $user = $request->user();

        broadcast(new UserTyping(
            conversationId: $conversation->id,
            userId: $user->id,
            userName: $user->fullname ?? '',
            isTyping: (bool) $request->input('is_typing', true),
        ))->toOthers();

        return response()->json(['status' => 'ok']);
    }
}
