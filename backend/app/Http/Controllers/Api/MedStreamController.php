<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Models\MedStreamReport;
use App\Models\MedStreamEngagementCounter;
use App\Notifications\PostCommentedNotification;
use App\Services\MediaOptimizer;
use Illuminate\Http\Request;

class MedStreamController extends Controller
{
    // ── Posts ──

    public function posts(Request $request)
    {
        $userId = $request->user()?->id;

        $posts = MedStreamPost::visible()
            ->with(['author:id,fullname,avatar,role_id', 'clinic:id,fullname,avatar', 'engagementCounter'])
            ->when($request->author_id, fn($q, $v) => $q->where('author_id', $v))
            ->when($request->clinic_id, fn($q, $v) => $q->where('clinic_id', $v))
            ->when($request->post_type, fn($q, $v) => $q->where('post_type', $v))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        // Append is_liked + is_bookmarked for authenticated user
        if ($userId) {
            $postIds = $posts->pluck('id')->toArray();
            $likedPostIds = MedStreamLike::where('user_id', $userId)
                ->where('is_active', true)
                ->whereIn('post_id', $postIds)
                ->pluck('post_id')
                ->toArray();
            $bookmarkedPostIds = MedStreamBookmark::where('user_id', $userId)
                ->where('is_active', true)
                ->where('bookmarked_type', 'post')
                ->whereIn('target_id', $postIds)
                ->pluck('target_id')
                ->toArray();

            $posts->getCollection()->transform(function ($post) use ($likedPostIds, $bookmarkedPostIds) {
                $post->is_liked = in_array($post->id, $likedPostIds);
                $post->is_bookmarked = in_array($post->id, $bookmarkedPostIds);
                return $post;
            });
        }

        return response()->json($posts);
    }

    public function showPost(string $id, Request $request)
    {
        $post = MedStreamPost::visible()
            ->with(['author:id,fullname,avatar,role_id', 'clinic:id,fullname,avatar', 'engagementCounter', 'comments' => fn($q) => $q->active()->where('is_hidden', false)->with('author:id,fullname,avatar')->latest()->limit(20)])
            ->findOrFail($id);

        // Append is_liked + is_bookmarked for authenticated user
        $userId = $request->user()?->id;
        $post->is_liked = $userId
            ? MedStreamLike::where('user_id', $userId)->where('post_id', $id)->where('is_active', true)->exists()
            : false;
        $post->is_bookmarked = $userId
            ? MedStreamBookmark::where('user_id', $userId)->where('bookmarked_type', 'post')->where('target_id', $id)->where('is_active', true)->exists()
            : false;

        return response()->json(['post' => $post]);
    }

    public function storePost(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin', 'saasAdmin'])) {
            return response()->json(['message' => 'Only doctors and clinic owners can create posts.'], 403);
        }

        $validated = $request->validate([
            'post_type'  => 'required|in:text,image,video,document,mixed',
            'content'    => 'sometimes|string',
            'media_url'  => 'sometimes|string|url',
            'clinic_id'  => 'sometimes|uuid|exists:clinics,id',
            'photos'     => 'sometimes|array',
            'photos.*'   => 'file|mimes:jpg,jpeg,png,gif,bmp,webp,svg,heic,heif|max:10240', // 10 MB
            'videos'     => 'sometimes|array',
            'videos.*'   => 'file|mimetypes:video/mp4,video/quicktime,video/webm,video/avi|max:102400', // 100 MB
            'papers'     => 'sometimes|array',
            'papers.*'   => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,csv|max:20480',  // 20 MB
        ]);

        // Handle file uploads with optimization (resize, compress, thumbnails)
        $mediaUrl = $validated['media_url'] ?? null;
        $uploadedFiles = [];

        // Process photos — resize to 3 variants (thumb 400px, medium 1200px, original 2048px) + WebP
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $result = MediaOptimizer::processImage($file);
                $uploadedFiles[] = $result;
                if (!$mediaUrl) {
                    $mediaUrl = $result['medium'] ?? $result['original'];
                }
            }
        }

        // Process videos — compress with FFmpeg if available + extract thumbnail
        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $file) {
                $result = MediaOptimizer::processVideo($file);
                $uploadedFiles[] = $result;
                if (!$mediaUrl) {
                    $mediaUrl = $result['thumb'] ?? $result['original'];
                }
            }
        }

        // Process documents — store as-is with metadata
        if ($request->hasFile('papers')) {
            foreach ($request->file('papers') as $file) {
                $result = MediaOptimizer::processDocument($file);
                $uploadedFiles[] = $result;
                if (!$mediaUrl) {
                    $mediaUrl = $result['original'];
                }
            }
        }

        $postData = [
            'author_id' => $user->id,
            'clinic_id' => $validated['clinic_id'] ?? $user->clinic_id,
            'post_type' => $validated['post_type'],
            'content'   => $validated['content'] ?? null,
            'media_url' => $mediaUrl,
            'media'     => !empty($uploadedFiles) ? $uploadedFiles : null,
        ];

        try {
            $post = MedStreamPost::create($postData);
        } catch (\Illuminate\Database\QueryException $e) {
            // Auto-fix: if post_type constraint fails, update it and retry
            if (str_contains($e->getMessage(), 'post_type_check') || str_contains($e->getMessage(), 'check constraint')) {
                try {
                    $driver = \DB::connection()->getDriverName();
                    if ($driver === 'pgsql') {
                        \DB::statement("ALTER TABLE med_stream_posts DROP CONSTRAINT IF EXISTS med_stream_posts_post_type_check");
                        \DB::statement("ALTER TABLE med_stream_posts ADD CONSTRAINT med_stream_posts_post_type_check CHECK (post_type::text = ANY (ARRAY['text','image','video','document','mixed']))");
                    }
                    $post = MedStreamPost::create($postData);
                } catch (\Throwable $retryErr) {
                    \Log::error('MedStream storePost retry failed', ['error' => $retryErr->getMessage()]);
                    return response()->json(['message' => 'Failed to create post. Please contact support.'], 500);
                }
            } else {
                throw $e;
            }
        }

        // Create engagement counter
        MedStreamEngagementCounter::create([
            'post_id'       => $post->id,
            'like_count'    => 0,
            'comment_count' => 0,
        ]);

        $post->load('author:id,fullname,avatar');

        return response()->json(['post' => $post], 201);
    }

    public function updatePost(Request $request, string $id)
    {
        $post = MedStreamPost::active()->findOrFail($id);

        if ($post->author_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'content' => 'sometimes|string',
            'media_url' => 'sometimes|string|url',
            'is_hidden' => 'sometimes|boolean',
        ]);

        $post->update($validated);

        return response()->json(['post' => $post->fresh()]);
    }

    public function destroyPost(string $id, Request $request)
    {
        $post = MedStreamPost::active()->findOrFail($id);

        if ($post->author_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $post->update(['is_active' => false]);

        return response()->json(['message' => 'Post deleted.']);
    }

    // ── Comments ──

    public function comments(Request $request, string $postId)
    {
        $comments = MedStreamComment::active()
            ->where('post_id', $postId)
            ->where('is_hidden', false)
            ->with('author:id,fullname,avatar')
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($comments);
    }

    public function storeComment(Request $request, string $postId)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $post = MedStreamPost::with('author:id,fullname')->findOrFail($postId);

        $comment = MedStreamComment::create([
            'post_id' => $postId,
            'author_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Increment comment counter
        MedStreamEngagementCounter::where('post_id', $postId)->increment('comment_count');

        // Notify post owner (except when user comments on own post)
        try {
            if ($post->author && $post->author_id !== $request->user()->id) {
                $post->author->notify(
                    new PostCommentedNotification(
                        $post,
                        $comment,
                        $request->user()->fullname ?? 'Someone'
                    )
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Post comment notification failed: ' . $e->getMessage());
        }

        return response()->json(['comment' => $comment->load('author:id,fullname,avatar')], 201);
    }

    // ── Likes ──

    public function toggleLike(Request $request, string $postId)
    {
        $userId = $request->user()->id;

        $existing = MedStreamLike::where('post_id', $postId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->is_active) {
                $existing->update(['is_active' => false]);
                MedStreamEngagementCounter::where('post_id', $postId)->decrement('like_count');
                return response()->json(['liked' => false]);
            } else {
                $existing->update(['is_active' => true]);
                MedStreamEngagementCounter::where('post_id', $postId)->increment('like_count');
                return response()->json(['liked' => true]);
            }
        }

        MedStreamLike::create(['post_id' => $postId, 'user_id' => $userId]);
        MedStreamEngagementCounter::where('post_id', $postId)->increment('like_count');

        return response()->json(['liked' => true], 201);
    }

    // ── Bookmarks ──

    public function bookmarks(Request $request)
    {
        $bookmarks = MedStreamBookmark::active()
            ->where('user_id', $request->user()->id)
            ->when($request->type, fn($q, $v) => $q->where('bookmarked_type', $v))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($bookmarks);
    }

    public function toggleBookmark(Request $request)
    {
        $validated = $request->validate([
            'bookmarked_type' => 'required|in:post,doctor,clinic,patient',
            'target_id' => 'required|uuid',
        ]);

        $existing = MedStreamBookmark::where('user_id', $request->user()->id)
            ->where('bookmarked_type', $validated['bookmarked_type'])
            ->where('target_id', $validated['target_id'])
            ->first();

        if ($existing) {
            $existing->update(['is_active' => !$existing->is_active]);
            return response()->json(['bookmarked' => $existing->fresh()->is_active]);
        }

        MedStreamBookmark::create([
            'user_id' => $request->user()->id,
            'bookmarked_type' => $validated['bookmarked_type'],
            'target_id' => $validated['target_id'],
        ]);

        return response()->json(['bookmarked' => true], 201);
    }

    // ── Reports ──

    public function storeReport(Request $request, string $postId)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $report = MedStreamReport::updateOrCreate(
            ['post_id' => $postId, 'reporter_id' => $request->user()->id],
            ['reason' => $validated['reason'], 'admin_status' => 'pending']
        );

        return response()->json(['report' => $report], 201);
    }

    public function reports(Request $request)
    {
        $reports = MedStreamReport::active()
            ->with(['post:id,content,author_id', 'reporter:id,fullname'])
            ->when($request->status, fn($q, $v) => $q->where('admin_status', $v))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($reports);
    }

    public function updateReport(Request $request, string $id)
    {
        $report = MedStreamReport::active()->findOrFail($id);

        $validated = $request->validate([
            'admin_status' => 'required|in:pending,reviewed,hidden,deleted',
        ]);

        $report->update($validated);

        // If hidden or deleted, hide the post too
        if (in_array($validated['admin_status'], ['hidden', 'deleted'])) {
            MedStreamPost::where('id', $report->post_id)->update(['is_hidden' => true]);
        }

        return response()->json(['report' => $report->fresh()]);
    }
}
