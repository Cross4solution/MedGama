<?php

namespace App\Services;

use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Models\MedStreamReport;
use App\Models\MedStreamEngagementCounter;
use App\Models\User;
use App\Jobs\ProcessMedStreamVideo;
use App\Notifications\PostCommentedNotification;
use App\Services\MediaOptimizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MedStreamService
{
    // ══════════════════════════════════════════════
    //  POSTS
    // ══════════════════════════════════════════════

    /**
     * List visible posts with engagement flags for the authenticated user.
     */
    public function listPosts(?string $userId, array $filters): LengthAwarePaginator
    {
        $posts = MedStreamPost::query()
            ->with(['author:id,fullname,avatar,role_id', 'clinic:id,fullname,avatar', 'engagementCounter'])
            ->when($filters['author_id'] ?? null, fn($q, $v) => $q->where('author_id', $v))
            ->when($filters['clinic_id'] ?? null, fn($q, $v) => $q->where('clinic_id', $v))
            ->when($filters['post_type'] ?? null, fn($q, $v) => $q->where('post_type', $v))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);

        if ($userId) {
            $this->appendEngagementFlags($posts, $userId);
        }

        return $posts;
    }

    /**
     * Load full details (relations + engagement flags) onto an existing post model.
     */
    public function loadPostDetails(MedStreamPost $post, ?string $userId): MedStreamPost
    {
        $post->load([
            'author:id,fullname,avatar,role_id',
            'clinic:id,fullname,avatar',
            'engagementCounter',
            'comments' => fn($q) => $q->where('is_hidden', false)
                ->whereNull('parent_id')
                ->with(['author:id,fullname,avatar', 'replies' => fn($r) => $r->with('author:id,fullname,avatar')->orderBy('created_at')])
                ->latest()
                ->limit(20),
        ]);

        $post->is_liked = $userId
            ? MedStreamLike::where('user_id', $userId)->where('post_id', $post->id)->where('is_active', true)->exists()
            : false;
        $post->is_bookmarked = $userId
            ? MedStreamBookmark::where('user_id', $userId)->where('bookmarked_type', 'post')->where('target_id', $post->id)->where('is_active', true)->exists()
            : false;

        return $post;
    }

    /**
     * Create a post: process media uploads, persist post + engagement counter.
     * All inside a DB::transaction for atomicity.
     *
     * @param array<string, mixed>                          $data
     * @param array{photos: UploadedFile[], videos: UploadedFile[], papers: UploadedFile[]} $files
     */
    public function createPost(User $author, array $data, array $files): MedStreamPost
    {
        // 1. Process uploads (photos/docs sync, videos saved to temp)
        $mediaResult = $this->processMediaUploads($data, $files);
        $hasVideos   = !empty($mediaResult['pending_videos']);

        // 2. Persist post + engagement counter atomically
        $post = DB::transaction(function () use ($author, $data, $mediaResult, $hasVideos) {
            $postData = [
                'author_id'        => $author->id,
                'clinic_id'        => $data['clinic_id'] ?? $author->clinic_id,
                'post_type'        => $data['post_type'],
                'content'          => $data['content'] ?? null,
                'media_url'        => $mediaResult['media_url'],
                'media'            => $mediaResult['uploaded_files'] ?: null,
                'media_processing' => $hasVideos,
            ];

            $post = MedStreamPost::create($postData);

            MedStreamEngagementCounter::create([
                'post_id'       => $post->id,
                'like_count'    => 0,
                'comment_count' => 0,
            ]);

            return $post;
        });

        // 3. Dispatch async video processing jobs
        foreach ($mediaResult['pending_videos'] as $video) {
            ProcessMedStreamVideo::dispatch(
                $post->id,
                $video['temp_path'],
                $video['original_name'],
                $video['file_size'],
                $video['media_index'],
            );
        }

        $post->load('author:id,fullname,avatar');

        return $post;
    }

    /**
     * Update a post (authorization handled by Policy).
     */
    public function updatePost(MedStreamPost $post, array $data): MedStreamPost
    {
        $post->update($data);

        return $post->refresh();
    }

    /**
     * Soft-delete a post and all related records inside a transaction.
     */
    public function destroyPost(MedStreamPost $post): void
    {
        // Delete media files from disk (outside transaction)
        $this->deletePostMedia($post);

        DB::transaction(function () use ($post) {
            MedStreamComment::where('post_id', $post->id)->update(['is_active' => false]);
            MedStreamLike::where('post_id', $post->id)->update(['is_active' => false]);
            MedStreamReport::where('post_id', $post->id)->update(['is_active' => false]);
            MedStreamEngagementCounter::where('post_id', $post->id)->delete();

            $post->delete();
        });
    }

    // ══════════════════════════════════════════════
    //  COMMENTS
    // ══════════════════════════════════════════════

    /**
     * List top-level comments for a post with nested replies.
     */
    public function listComments(string $postId, array $filters): LengthAwarePaginator
    {
        return MedStreamComment::where('post_id', $postId)
            ->where('is_hidden', false)
            ->whereNull('parent_id')
            ->with([
                'author:id,fullname,avatar',
                'replies' => fn($q) => $q->with('author:id,fullname,avatar')->orderBy('created_at'),
            ])
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Create a comment, increment counter, notify post author.
     */
    public function createComment(User $author, MedStreamPost $post, array $data): MedStreamComment
    {
        $post->loadMissing('author:id,fullname');

        $comment = DB::transaction(function () use ($author, $post, $data) {
            $comment = MedStreamComment::create([
                'post_id'   => $post->id,
                'author_id' => $author->id,
                'parent_id' => $data['parent_id'] ?? null,
                'content'   => $data['content'],
            ]);

            MedStreamEngagementCounter::where('post_id', $post->id)->increment('comment_count');

            return $comment;
        });

        // Notification (outside transaction — fire-and-forget)
        $this->notifyPostAuthor($post, $comment, $author);

        return $comment->load('author:id,fullname,avatar');
    }

    /**
     * Update a comment (authorization handled by Policy).
     */
    public function updateComment(MedStreamComment $comment, array $data): MedStreamComment
    {
        $comment->update($data);

        return $comment->refresh()->load('author:id,fullname,avatar');
    }

    /**
     * Soft-delete a comment and decrement the engagement counter.
     */
    public function destroyComment(MedStreamComment $comment): void
    {
        DB::transaction(function () use ($comment) {
            MedStreamEngagementCounter::where('post_id', $comment->post_id)
                ->where('comment_count', '>', 0)
                ->decrement('comment_count');

            $comment->delete();
        });
    }

    // ══════════════════════════════════════════════
    //  LIKES
    // ══════════════════════════════════════════════

    /**
     * Toggle like on a post. Returns ['liked' => bool].
     */
    public function toggleLike(string $userId, string $postId): array
    {
        $existing = MedStreamLike::where('post_id', $postId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            $newState = !$existing->is_active;
            $existing->update(['is_active' => $newState]);

            if ($newState) {
                MedStreamEngagementCounter::where('post_id', $postId)->increment('like_count');
            } else {
                MedStreamEngagementCounter::where('post_id', $postId)->where('like_count', '>', 0)->decrement('like_count');
            }

            return ['liked' => $newState, 'created' => false];
        }

        MedStreamLike::create(['post_id' => $postId, 'user_id' => $userId]);
        MedStreamEngagementCounter::where('post_id', $postId)->increment('like_count');

        return ['liked' => true, 'created' => true];
    }

    // ══════════════════════════════════════════════
    //  BOOKMARKS
    // ══════════════════════════════════════════════

    /**
     * List user bookmarks.
     */
    public function listBookmarks(string $userId, array $filters): LengthAwarePaginator
    {
        return MedStreamBookmark::active()
            ->where('user_id', $userId)
            ->when($filters['type'] ?? null, fn($q, $v) => $q->where('bookmarked_type', $v))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Toggle bookmark. Returns ['bookmarked' => bool].
     */
    public function toggleBookmark(string $userId, array $data): array
    {
        $existing = MedStreamBookmark::where('user_id', $userId)
            ->where('bookmarked_type', $data['bookmarked_type'])
            ->where('target_id', $data['target_id'])
            ->first();

        if ($existing) {
            $newState = !$existing->is_active;
            $existing->update(['is_active' => $newState]);
            return ['bookmarked' => $newState, 'created' => false];
        }

        MedStreamBookmark::create([
            'user_id'        => $userId,
            'bookmarked_type' => $data['bookmarked_type'],
            'target_id'      => $data['target_id'],
        ]);

        return ['bookmarked' => true, 'created' => true];
    }

    // ══════════════════════════════════════════════
    //  REPORTS
    // ══════════════════════════════════════════════

    /**
     * Create or update a report on a post.
     */
    public function createReport(string $reporterId, string $postId, array $data): MedStreamReport
    {
        return MedStreamReport::updateOrCreate(
            ['post_id' => $postId, 'reporter_id' => $reporterId],
            ['reason' => $data['reason'], 'admin_status' => 'pending'],
        );
    }

    /**
     * List reports (admin).
     */
    public function listReports(array $filters): LengthAwarePaginator
    {
        return MedStreamReport::active()
            ->with(['post:id,content,author_id', 'reporter:id,fullname'])
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('admin_status', $v))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Update report status. If hidden/deleted, hide the post too.
     */
    public function updateReport(string $id, array $data): MedStreamReport
    {
        $report = MedStreamReport::active()->findOrFail($id);

        DB::transaction(function () use ($report, $data) {
            $report->update($data);

            if (in_array($data['admin_status'], ['hidden', 'deleted'])) {
                MedStreamPost::where('id', $report->post_id)->update(['is_hidden' => true]);
            }
        });

        return $report->refresh();
    }

    // ══════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ══════════════════════════════════════════════

    /**
     * Append is_liked / is_bookmarked flags to a paginated post collection.
     */
    private function appendEngagementFlags(LengthAwarePaginator $posts, string $userId): void
    {
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
            $post->is_liked     = in_array($post->id, $likedPostIds);
            $post->is_bookmarked = in_array($post->id, $bookmarkedPostIds);
            return $post;
        });
    }

    /**
     * Process photo/document uploads synchronously.
     * Videos are saved to temp and processed asynchronously via a Job.
     *
     * @return array{media_url: ?string, uploaded_files: array, pending_videos: array}
     */
    private function processMediaUploads(array $data, array $files): array
    {
        $mediaUrl      = $data['media_url'] ?? null;
        $uploadedFiles = [];
        $pendingVideos = [];

        // Photos (synchronous — fast with GD)
        foreach ($files['photos'] ?? [] as $file) {
            $result = MediaOptimizer::processImage($file);
            $uploadedFiles[] = $result;
            if (!$mediaUrl) {
                $mediaUrl = $result['medium'] ?? $result['original'];
            }
        }

        // Videos (async — save to temp, dispatch job later)
        foreach ($files['videos'] ?? [] as $file) {
            $tempName = Str::uuid() . '.' . ($file->getClientOriginalExtension() ?: 'mp4');
            $tempPath = storage_path('app/temp/' . $tempName);

            // Ensure temp directory exists
            if (!is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0755, true);
            }

            $file->move(dirname($tempPath), basename($tempPath));

            $placeholder = [
                'id'     => Str::uuid()->toString(),
                'type'   => 'video',
                'name'   => $file->getClientOriginalName(),
                'size'   => $file->getSize() ?: filesize($tempPath),
                'status' => 'processing',
            ];

            $uploadedFiles[] = $placeholder;
            $pendingVideos[] = [
                'temp_path'     => $tempPath,
                'original_name' => $placeholder['name'],
                'file_size'     => $placeholder['size'],
                'media_index'   => count($uploadedFiles) - 1,
            ];
        }

        // Documents (synchronous — just store)
        foreach ($files['papers'] ?? [] as $file) {
            $result = MediaOptimizer::processDocument($file);
            $uploadedFiles[] = $result;
            if (!$mediaUrl) {
                $mediaUrl = $result['original'];
            }
        }

        return [
            'media_url'      => $mediaUrl,
            'uploaded_files'  => $uploadedFiles,
            'pending_videos' => $pendingVideos,
        ];
    }


    /**
     * Delete all media files associated with a post from disk.
     */
    private function deletePostMedia(MedStreamPost $post): void
    {
        try {
            $mediaItems = $post->media;
            if (!is_array($mediaItems) || empty($mediaItems)) {
                return;
            }

            foreach ($mediaItems as $item) {
                foreach (['original', 'medium', 'thumb'] as $variant) {
                    $url = $item[$variant] ?? null;
                    if (!$url || !is_string($url)) {
                        continue;
                    }

                    $storagePath = $this->urlToStoragePath($url);
                    if ($storagePath && Storage::disk('public')->exists($storagePath)) {
                        Storage::disk('public')->delete($storagePath);
                    }
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to delete post media files', [
                'post_id' => $post->id,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /**
     * Convert a public asset URL to a storage-relative path.
     */
    private function urlToStoragePath(string $url): ?string
    {
        $marker = '/storage/';
        $pos    = strpos($url, $marker);
        if ($pos === false) {
            return null;
        }
        return substr($url, $pos + strlen($marker));
    }

    /**
     * Notify post author about a new comment (fire-and-forget).
     */
    private function notifyPostAuthor(MedStreamPost $post, MedStreamComment $comment, User $commenter): void
    {
        try {
            if ($post->author && $post->author_id !== $commenter->id) {
                $post->author->notify(
                    new PostCommentedNotification($post, $comment, $commenter->fullname ?? 'Someone')
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Post comment notification failed: ' . $e->getMessage());
        }
    }
}
