<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MedStream\StorePostRequest;
use App\Http\Requests\MedStream\UpdatePostRequest;
use App\Http\Requests\MedStream\StoreCommentRequest;
use App\Http\Requests\MedStream\UpdateCommentRequest;
use App\Http\Requests\MedStream\StoreReportRequest;
use App\Http\Requests\MedStream\UpdateReportRequest;
use App\Http\Requests\MedStream\ToggleBookmarkRequest;
use App\Http\Resources\MedStreamPostResource;
use App\Http\Resources\MedStreamCommentResource;
use App\Models\MedStreamComment;
use App\Models\MedStreamPost;
use App\Services\MedStreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;

class MedStreamController extends Controller
{
    public function __construct(
        private readonly MedStreamService $medStreamService,
    ) {}

    // ── Posts ──

    #[OA\Get(
        path: '/medstream/posts',
        summary: 'List posts (public, paginated)',
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'author_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'clinic_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'post_type', in: 'query', schema: new OA\Schema(type: 'string', enum: ['article', 'case', 'question', 'media'])),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated posts (MedStreamPostResource)'),
        ]
    )]
    public function posts(Request $request): AnonymousResourceCollection
    {
        $posts = $this->medStreamService->listPosts(
            $request->user()?->id,
            $request->only(['author_id', 'clinic_id', 'post_type', 'per_page']),
        );

        return MedStreamPostResource::collection($posts);
    }

    #[OA\Get(
        path: '/medstream/posts/{post}',
        summary: 'Show post detail with comments and engagement',
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'post', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Post detail (MedStreamPostResource)'),
            new OA\Response(response: 404, description: 'Not found'),
        ]
    )]
    public function showPost(MedStreamPost $post, Request $request): JsonResponse
    {
        $this->authorize('view', $post);

        $post = $this->medStreamService->loadPostDetails($post, $request->user()?->id);

        return (new MedStreamPostResource($post))->response();
    }

    #[OA\Post(
        path: '/medstream/posts',
        summary: 'Create post (doctor/clinicOwner/admin). Videos processed asynchronously.',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        requestBody: new OA\RequestBody(
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['post_type', 'content'],
                    properties: [
                        new OA\Property(property: 'post_type', type: 'string', enum: ['article', 'case', 'question', 'media']),
                        new OA\Property(property: 'content', type: 'string'),
                        new OA\Property(property: 'clinic_id', type: 'string', format: 'uuid'),
                        new OA\Property(property: 'photos[]', type: 'array', items: new OA\Items(type: 'string', format: 'binary')),
                        new OA\Property(property: 'videos[]', type: 'array', items: new OA\Items(type: 'string', format: 'binary')),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Post created (media_processing may be true for videos)'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function storePost(StorePostRequest $request): JsonResponse
    {
        $post = $this->medStreamService->createPost(
            $request->user(),
            $request->validated(),
            [
                'photos' => $request->file('photos', []),
                'videos' => $request->file('videos', []),
                'papers' => $request->file('papers', []),
            ],
        );

        return (new MedStreamPostResource($post))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Put(
        path: '/medstream/posts/{post}',
        summary: 'Update post (author or admin)',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'post', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Post updated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function updatePost(UpdatePostRequest $request, MedStreamPost $post): JsonResponse
    {
        $this->authorize('update', $post);

        $post = $this->medStreamService->updatePost($post, $request->validated());

        return (new MedStreamPostResource($post))->response();
    }

    #[OA\Delete(
        path: '/medstream/posts/{post}',
        summary: 'Delete post (author or admin)',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'post', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Post deleted'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function destroyPost(MedStreamPost $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $this->medStreamService->destroyPost($post);

        return response()->json(['message' => 'Post deleted.']);
    }

    // ── Comments ──

    #[OA\Get(
        path: '/medstream/posts/{post}/comments',
        summary: 'List comments for a post',
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'post', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated comments (MedStreamCommentResource)'),
        ]
    )]
    public function comments(Request $request, MedStreamPost $post): AnonymousResourceCollection
    {
        $comments = $this->medStreamService->listComments(
            $post->id,
            $request->only(['per_page']),
        );

        return MedStreamCommentResource::collection($comments);
    }

    #[OA\Post(
        path: '/medstream/posts/{post}/comments',
        summary: 'Add comment (supports threaded replies via parent_id)',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'post', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['content'],
                properties: [
                    new OA\Property(property: 'content', type: 'string'),
                    new OA\Property(property: 'parent_id', type: 'string', format: 'uuid', description: 'For threaded replies'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Comment created'),
        ]
    )]
    public function storeComment(StoreCommentRequest $request, MedStreamPost $post): JsonResponse
    {
        $comment = $this->medStreamService->createComment(
            $request->user(),
            $post,
            $request->validated(),
        );

        return (new MedStreamCommentResource($comment))
            ->response()
            ->setStatusCode(201);
    }

    public function updateComment(UpdateCommentRequest $request, MedStreamComment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $comment = $this->medStreamService->updateComment($comment, $request->validated());

        return (new MedStreamCommentResource($comment))->response();
    }

    public function destroyComment(MedStreamComment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $this->medStreamService->destroyComment($comment);

        return response()->json(['message' => 'Comment deleted.']);
    }

    // ── Likes ──

    #[OA\Post(
        path: '/medstream/posts/{post}/like',
        summary: 'Toggle like on post',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'post', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Like toggled'),
        ]
    )]
    public function toggleLike(Request $request, MedStreamPost $post): JsonResponse
    {
        $result = $this->medStreamService->toggleLike($request->user()->id, $post->id);

        return response()->json(
            ['liked' => $result['liked']],
            $result['created'] ? 201 : 200,
        );
    }

    // ── Bookmarks ──

    #[OA\Get(
        path: '/medstream/bookmarks',
        summary: 'List bookmarked posts',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        responses: [
            new OA\Response(response: 200, description: 'Paginated bookmarks'),
        ]
    )]
    public function bookmarks(Request $request): JsonResponse
    {
        $bookmarks = $this->medStreamService->listBookmarks(
            $request->user()->id,
            $request->only(['type', 'per_page']),
        );

        return response()->json($bookmarks);
    }

    #[OA\Post(
        path: '/medstream/bookmarks',
        summary: 'Toggle bookmark',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['bookmarked_type', 'target_id'],
                properties: [
                    new OA\Property(property: 'bookmarked_type', type: 'string'),
                    new OA\Property(property: 'target_id', type: 'string', format: 'uuid'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Bookmark toggled'),
        ]
    )]
    public function toggleBookmark(ToggleBookmarkRequest $request): JsonResponse
    {
        $result = $this->medStreamService->toggleBookmark(
            $request->user()->id,
            $request->validated(),
        );

        return response()->json(
            ['bookmarked' => $result['bookmarked']],
            $result['created'] ? 201 : 200,
        );
    }

    // ── Reports ──

    #[OA\Post(
        path: '/medstream/posts/{post}/report',
        summary: 'Report a post',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'post', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['reason'],
                properties: [new OA\Property(property: 'reason', type: 'string')]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Report created'),
        ]
    )]
    public function storeReport(StoreReportRequest $request, MedStreamPost $post): JsonResponse
    {
        $report = $this->medStreamService->createReport(
            $request->user()->id,
            $post->id,
            $request->validated(),
        );

        return response()->json(['report' => $report], 201);
    }

    #[OA\Get(
        path: '/medstream/reports',
        summary: 'List reports (admin only)',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated reports'),
        ]
    )]
    public function reports(Request $request): JsonResponse
    {
        $reports = $this->medStreamService->listReports(
            $request->only(['status', 'per_page']),
        );

        return response()->json($reports);
    }

    #[OA\Put(
        path: '/medstream/reports/{id}',
        summary: 'Update report status (admin only)',
        security: [['sanctum' => []]],
        tags: ['MedStream'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Report updated'),
        ]
    )]
    public function updateReport(UpdateReportRequest $request, string $id): JsonResponse
    {
        $report = $this->medStreamService->updateReport($id, $request->validated());

        return response()->json(['report' => $report]);
    }
}
