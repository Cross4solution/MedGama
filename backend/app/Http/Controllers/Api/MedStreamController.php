<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Models\MedStreamReport;
use App\Models\MedStreamEngagementCounter;
use Illuminate\Http\Request;

class MedStreamController extends Controller
{
    // ── Posts ──

    public function posts(Request $request)
    {
        $posts = MedStreamPost::visible()
            ->with(['author:id,fullname,avatar,role_id', 'clinic:id,fullname,avatar', 'engagementCounter'])
            ->when($request->author_id, fn($q, $v) => $q->where('author_id', $v))
            ->when($request->clinic_id, fn($q, $v) => $q->where('clinic_id', $v))
            ->when($request->post_type, fn($q, $v) => $q->where('post_type', $v))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($posts);
    }

    public function showPost(string $id)
    {
        $post = MedStreamPost::visible()
            ->with(['author:id,fullname,avatar,role_id', 'clinic:id,fullname,avatar', 'engagementCounter', 'comments' => fn($q) => $q->active()->where('is_hidden', false)->with('author:id,fullname,avatar')->latest()->limit(20)])
            ->findOrFail($id);

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
            'photos.*'   => 'file|image|max:10240',                                      // 10 MB
            'videos'     => 'sometimes|array',
            'videos.*'   => 'file|mimetypes:video/mp4,video/quicktime,video/webm,video/avi|max:102400', // 100 MB
            'papers'     => 'sometimes|array',
            'papers.*'   => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,csv|max:20480',  // 20 MB
        ]);

        // Handle file uploads — store first file as media_url, rest as JSON in content metadata
        $mediaUrl = $validated['media_url'] ?? null;
        $uploadedFiles = [];

        foreach (['photos', 'videos', 'papers'] as $field) {
            if ($request->hasFile($field)) {
                foreach ($request->file($field) as $file) {
                    $path = $file->store('medstream/' . $field, 'public');
                    $url = asset('storage/' . $path);
                    $uploadedFiles[] = ['url' => $url, 'type' => $field, 'name' => $file->getClientOriginalName()];
                    if (!$mediaUrl) {
                        $mediaUrl = $url;
                    }
                }
            }
        }

        $postData = [
            'author_id' => $user->id,
            'clinic_id' => $validated['clinic_id'] ?? $user->clinic_id,
            'post_type' => $validated['post_type'],
            'content'   => $validated['content'] ?? null,
            'media_url' => $mediaUrl,
        ];

        $post = MedStreamPost::create($postData);

        // Create engagement counter
        MedStreamEngagementCounter::create([
            'post_id'       => $post->id,
            'like_count'    => 0,
            'comment_count' => 0,
        ]);

        $postResponse = $post->load('author:id,fullname,avatar')->toArray();
        $postResponse['media'] = $uploadedFiles;

        return response()->json(['post' => $postResponse], 201);
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

        $comment = MedStreamComment::create([
            'post_id' => $postId,
            'author_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Increment comment counter
        MedStreamEngagementCounter::where('post_id', $postId)->increment('comment_count');

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
