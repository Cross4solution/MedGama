<?php

namespace App\Services;

use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Models\MedStreamReport;
use App\Models\MedStreamEngagementCounter;
use App\Models\DoctorFollow;
use App\Models\User;
use App\Jobs\ProcessMedStreamVideo;
use App\Notifications\PostCommentedNotification;
use App\Notifications\PostLikedNotification;
use App\Services\MediaOptimizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\AuditLog;

class MedStreamService
{
    // ══════════════════════════════════════════════
    //  POSTS
    // ══════════════════════════════════════════════

    /**
     * Engagement score SQL fragment: (likes * 2) + (comments * 5)
     */
    private function engagementScoreSql(): string
    {
        return '(COALESCE((SELECT like_count FROM med_stream_engagement_counters WHERE post_id = med_stream_posts.id), 0) * 2
              + COALESCE((SELECT comment_count FROM med_stream_engagement_counters WHERE post_id = med_stream_posts.id), 0) * 5)';
    }

    /**
     * List visible posts with engagement flags for the authenticated user.
     *
     * sort=recent  → Followed first (chrono), then global (chrono)
     * sort=top     → Last 30 days, followed first (score DESC), then global (score DESC)
     */
    public function listPosts(?string $userId, array $filters): LengthAwarePaginator
    {
        $sort = $filters['sort'] ?? 'recent';

        $query = MedStreamPost::query()
            ->with([
                'author:id,fullname,avatar,role_id',
                'clinic:id,fullname,avatar',
                'hospital:id,name,avatar',
                'specialty:id,code,name',
                'engagementCounter',
            ])
            ->withCount([
                'comments as real_comment_count' => fn($q) => $q->where('is_hidden', false),
                'likes as real_like_count' => fn($q) => $q->where('is_active', true),
                'reports as report_count',
            ])
            ->when($filters['author_id'] ?? null, fn($q, $v) => $q->where('author_id', $v))
            ->when($filters['clinic_id'] ?? null, fn($q, $v) => $q->where('clinic_id', $v))
            ->when($filters['hospital_id'] ?? null, fn($q, $v) => $q->where('hospital_id', $v))
            ->when($filters['post_type'] ?? null, fn($q, $v) => $q->where('post_type', $v))
            ->when($filters['specialty_id'] ?? null, fn($q, $v) => $q->where('specialty_id', $v))
            // Fuzzy full-text search on post content
            ->when($filters['search'] ?? null, fn($q, $v) =>
                $q->where('content', 'LIKE', '%' . $v . '%')
            )
            // Author specialization filter (doctor_profile.specialty)
            ->when($filters['specialization'] ?? null, fn($q, $v) =>
                $q->whereHas('author.doctorProfile', fn($dq) =>
                    $dq->where('specialty', 'LIKE', '%' . $v . '%')
                )
            )
            // Country filter (author's country field)
            ->when($filters['country'] ?? null, fn($q, $v) =>
                $q->whereHas('author', fn($uq) =>
                    $uq->where('country', 'LIKE', '%' . $v . '%')
                )
            );

        // Top Posts: restrict to last 30 days
        if ($sort === 'top') {
            $query->where('med_stream_posts.created_at', '>=', now()->subDays(30));
        }

        // Add is_followed_author subselect + engagement_score computed column
        if ($userId) {
            $query->addSelect(['med_stream_posts.*'])
                ->selectSub(
                    DoctorFollow::selectRaw('1')
                        ->whereColumn('following_id', 'med_stream_posts.author_id')
                        ->where('follower_id', $userId)
                        ->where('is_active', true)
                        ->limit(1),
                    'is_followed_author'
                )
                ->selectRaw($this->engagementScoreSql() . ' as engagement_score');

            // Primary: followed authors first (MySQL-compatible NULLS LAST equivalent)
            $query->orderByRaw('(is_followed_author IS NULL) ASC, is_followed_author DESC');

            // Secondary: by sort mode
            if ($sort === 'top') {
                $query->orderByRaw('engagement_score DESC');
            } else {
                $query->orderByDesc('med_stream_posts.created_at');
            }
        } else {
            // Guest user — no follow prioritization
            $query->selectRaw('med_stream_posts.*, ' . $this->engagementScoreSql() . ' as engagement_score');

            if ($sort === 'top') {
                $query->orderByRaw('engagement_score DESC');
            } else {
                $query->orderByDesc('med_stream_posts.created_at');
            }
        }

        $posts = $query->paginate($filters['per_page'] ?? 20);

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
        $post->loadCount([
            'comments as real_comment_count' => fn($q) => $q->where('is_hidden', false),
            'likes as real_like_count' => fn($q) => $q->where('is_active', true),
        ]);
        $post->load([
            'author:id,fullname,avatar,role_id',
            'clinic:id,fullname,avatar',
            'hospital:id,name,avatar',
            'specialty:id,code,name',
            'engagementCounter',
            'comments' => fn($q) => $q->where('is_hidden', false)
                ->whereNull('parent_id')
                ->with(['author:id,fullname,avatar', 'allReplies'])
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
                'hospital_id'      => $data['hospital_id'] ?? $author->hospital_id,
                'specialty_id'     => $data['specialty_id'] ?? null,
                'post_type'        => $data['post_type'],
                'content'          => $data['content'] ?? null,
                'media_url'        => $mediaResult['media_url'],
                'media'            => $mediaResult['uploaded_files'] ?: null,
                'media_processing' => $hasVideos,
                'is_anonymous'     => (bool) ($data['is_anonymous'] ?? false),
                'gdpr_consent'     => (bool) ($data['gdpr_consent'] ?? false),
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

        // Audit log — media upload tracking
        $mediaTypes = collect($mediaResult['uploaded_files'] ?? [])->pluck('type')->unique()->values()->toArray();
        AuditLog::log(
            action: 'medstream.post.created',
            resourceType: 'MedStreamPost',
            resourceId: $post->id,
            newValues: [
                'post_type'   => $post->post_type,
                'media_types' => $mediaTypes,
                'media_count' => count($mediaResult['uploaded_files'] ?? []),
                'has_videos'  => $hasVideos,
            ],
            description: "MedStream post created by {$author->fullname} ({$post->post_type})" . ($hasVideos ? ' — video processing queued' : ''),
        );

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
        // Audit log — media deletion tracking
        $mediaTypes = collect($post->media ?? [])->pluck('type')->unique()->values()->toArray();
        AuditLog::log(
            action: 'medstream.post.deleted',
            resourceType: 'MedStreamPost',
            resourceId: $post->id,
            oldValues: [
                'post_type'   => $post->post_type,
                'media_types' => $mediaTypes,
                'media_count' => count($post->media ?? []),
                'author_id'   => $post->author_id,
            ],
            description: "MedStream post deleted (type: {$post->post_type}, media: " . count($post->media ?? []) . ")",
        );

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
                'allReplies',
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
     * Soft-delete a comment (and all descendants) and decrement counter by actual removed count.
     */
    public function destroyComment(MedStreamComment $comment): void
    {
        DB::transaction(function () use ($comment) {
            $idsToDelete = $this->collectDescendantCommentIds($comment->id);
            $decrementBy = MedStreamComment::whereIn('id', $idsToDelete)->count();

            if ($decrementBy > 0) {
                MedStreamEngagementCounter::where('post_id', $comment->post_id)
                    ->where('comment_count', '>', 0)
                    ->decrement('comment_count', $decrementBy);
            }

            MedStreamComment::whereIn('id', $idsToDelete)->delete();
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
        $result = DB::transaction(function () use ($userId, $postId) {
            $existing = MedStreamLike::where('post_id', $postId)
                ->where('user_id', $userId)
                ->first();

            if ($existing) {
                // IMPORTANT: compute $newState BEFORE update(), because update() + save()
                // syncs originals — getOriginal() would return the NEW value after that.
                $newState = !$existing->is_active;
                $existing->update(['is_active' => $newState]);

                if ($newState) {
                    MedStreamEngagementCounter::where('post_id', $postId)->increment('like_count');
                } else {
                    MedStreamEngagementCounter::where('post_id', $postId)->where('like_count', '>', 0)->decrement('like_count');
                }

                $liked = $newState;
                $created = false;
            } else {
                MedStreamLike::create(['post_id' => $postId, 'user_id' => $userId]);
                MedStreamEngagementCounter::where('post_id', $postId)->increment('like_count');

                $liked = true;
                $created = true;
            }

            $realCount = MedStreamLike::where('post_id', $postId)->where('is_active', true)->count();

            return ['liked' => $liked, 'created' => $created, 'like_count' => $realCount];
        });

        // Notify post author about the like (outside transaction, fire-and-forget)
        if ($result['liked']) {
            $this->notifyPostAuthorAboutLike($userId, $postId);
        }

        return $result;
    }

    // ══════════════════════════════════════════════
    //  BOOKMARKS
    // ══════════════════════════════════════════════

    /**
     * List user bookmarks.
     */
    public function listBookmarks(string $userId, array $filters): LengthAwarePaginator
    {
        // For post bookmarks, return full post data with engagement
        $query = MedStreamBookmark::active()
            ->where('user_id', $userId)
            ->when($filters['type'] ?? null, fn($q, $v) => $q->where('bookmarked_type', $v))
            ->orderByDesc('created_at');

        $bookmarks = $query->paginate($filters['per_page'] ?? 20);

        // Eager-load post details for post bookmarks (Saved Posts — Bölüm 4.7)
        $postIds = $bookmarks->getCollection()
            ->where('bookmarked_type', 'post')
            ->pluck('target_id')
            ->unique()
            ->values();

        if ($postIds->isNotEmpty()) {
            $posts = MedStreamPost::whereIn('id', $postIds)
                ->with(['author:id,fullname,avatar,role_id', 'clinic:id,fullname,avatar', 'hospital:id,name,avatar', 'engagementCounter'])
                ->withCount([
                    'comments as real_comment_count' => fn($q) => $q->where('is_hidden', false),
                    'likes as real_like_count' => fn($q) => $q->where('is_active', true),
                ])
                ->get()
                ->keyBy('id');

            $bookmarks->getCollection()->transform(function ($bookmark) use ($posts) {
                if ($bookmark->bookmarked_type === 'post' && isset($posts[$bookmark->target_id])) {
                    $bookmark->post = $posts[$bookmark->target_id];
                }
                return $bookmark;
            });
        }

        return $bookmarks;
    }

    /**
     * Toggle bookmark. Returns ['bookmarked' => bool].
     */
    public function toggleBookmark(string $userId, array $data): array
    {
        $type = $data['bookmarked_type'] ?? 'post';
        $targetId = $data['target_id'] ?? $data['post_id'] ?? null;

        if (!$targetId) {
            return ['bookmarked' => false, 'created' => false];
        }

        return DB::transaction(function () use ($userId, $type, $targetId) {
            $existing = MedStreamBookmark::where('user_id', $userId)
                ->where('bookmarked_type', $type)
                ->where('target_id', $targetId)
                ->first();

            if ($existing) {
                $newState = !$existing->is_active;
                $existing->update(['is_active' => $newState]);
                return ['bookmarked' => $newState, 'created' => false];
            }

            MedStreamBookmark::create([
                'user_id'        => $userId,
                'bookmarked_type' => $type,
                'target_id'      => $targetId,
            ]);

            return ['bookmarked' => true, 'created' => true];
        });
    }

    // ══════════════════════════════════════════════
    //  REPORTS
    // ══════════════════════════════════════════════

    /**
     * Create or update a report on a post.
     */
    public function createReport(string $reporterId, string $postId, array $data): MedStreamReport
    {
        $report = MedStreamReport::updateOrCreate(
            ['post_id' => $postId, 'reporter_id' => $reporterId],
            ['reason' => $data['reason'], 'admin_status' => 'pending'],
        );

        // Auto-hide if threshold reached
        $this->checkAutoHideThreshold($postId);

        return $report;
    }

    /**
     * List reports (admin).
     */
    public function listReports(array $filters): LengthAwarePaginator
    {
        return MedStreamReport::active()
            ->with([
                'post:id,content,author_id,is_hidden',
                'post.author:id,fullname,avatar',
                'reporter:id,fullname',
                'resolver:id,fullname',
            ])
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('admin_status', $v))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Update report status. If hidden/deleted, hide the post too.
     * Records resolver info and timestamps for audit trail.
     */
    public function updateReport(string $id, array $data, ?string $adminId = null): MedStreamReport
    {
        $report = MedStreamReport::active()->findOrFail($id);

        DB::transaction(function () use ($report, $data, $adminId) {
            $updateData = $data;

            // Stamp resolver info when status changes from pending
            if (isset($data['admin_status']) && $data['admin_status'] !== 'pending') {
                $updateData['resolved_by'] = $adminId;
                $updateData['resolved_at'] = now();
            }

            $report->update($updateData);

            // Moderation action: hide or soft-delete the post
            if (isset($data['admin_status']) && in_array($data['admin_status'], ['hidden', 'deleted'])) {
                MedStreamPost::withoutGlobalScopes()
                    ->where('id', $report->post_id)
                    ->update(['is_hidden' => true]);
            }
        });

        return $report->refresh()->load(['post:id,content,author_id', 'reporter:id,fullname', 'resolver:id,fullname']);
    }

    /**
     * Auto-hide post if it accumulates too many reports (moderation threshold).
     * Called after createReport. Threshold configurable via config.
     */
    public function checkAutoHideThreshold(string $postId): bool
    {
        $threshold = config('medstream.auto_hide_report_threshold', 3);

        $reportCount = MedStreamReport::where('post_id', $postId)
            ->where('admin_status', 'pending')
            ->where('is_active', true)
            ->count();

        if ($reportCount >= $threshold) {
            MedStreamPost::withoutGlobalScopes()
                ->where('id', $postId)
                ->update(['is_hidden' => true]);

            return true;
        }

        return false;
    }

    /**
     * Increment view count for a post (fire-and-forget, no transaction needed).
     */
    public function incrementViewCount(string $postId): void
    {
        MedStreamPost::withoutGlobalScopes()
            ->where('id', $postId)
            ->increment('view_count');
    }

    // ══════════════════════════════════════════════
    //  FEED ALGORITHM  (Bölüm 5)
    // ══════════════════════════════════════════════

    /**
     * Smart feed: followed doctors first, then popular/recent posts.
     * When user follows nobody → Explore mode (global only).
     *
     * sort=recent  → Followed first (chrono), then global (chrono)
     * sort=top     → Last 30 days, followed first (score DESC), then global (score DESC)
     */
    public function feed(string $userId, array $filters): array
    {
        $sort = $filters['sort'] ?? 'recent';

        $followingIds = DoctorFollow::where('follower_id', $userId)
            ->where('is_active', true)
            ->pluck('following_id')
            ->toArray();

        $isExplore = empty($followingIds);

        $baseQuery = MedStreamPost::query()
            ->with([
                'author:id,fullname,avatar,role_id',
                'clinic:id,fullname,avatar',
                'hospital:id,name,avatar',
                'specialty:id,code,name',
                'engagementCounter',
            ])
            ->withCount([
                'comments as real_comment_count' => fn($q) => $q->where('is_hidden', false),
                'likes as real_like_count' => fn($q) => $q->where('is_active', true),
            ])
            ->when($filters['specialty_id'] ?? null, fn($q, $v) => $q->where('specialty_id', $v))
            ->when($filters['post_type'] ?? null, fn($q, $v) => $q->where('post_type', $v));

        // Top Posts: restrict to last 30 days
        if ($sort === 'top') {
            $baseQuery->where('med_stream_posts.created_at', '>=', now()->subDays(30));
        }

        // Compute engagement_score column
        $baseQuery->selectRaw('med_stream_posts.*, ' . $this->engagementScoreSql() . ' as engagement_score');

        if (!$isExplore) {
            // Primary: followed authors first
            $placeholders = implode(',', array_fill(0, count($followingIds), '?'));
            $baseQuery->orderByRaw(
                "CASE WHEN author_id IN ({$placeholders}) THEN 0 ELSE 1 END ASC",
                $followingIds
            );
        }

        // Secondary: by sort mode
        if ($sort === 'top') {
            $baseQuery->orderByRaw('engagement_score DESC');
        } else {
            $baseQuery->orderByDesc('med_stream_posts.created_at');
        }

        $posts = $baseQuery->paginate($filters['per_page'] ?? 20);

        $this->appendEngagementFlags($posts, $userId);

        return [
            'posts'       => $posts,
            'is_explore'  => $isExplore,
            'following_count' => count($followingIds),
        ];
    }

    // ══════════════════════════════════════════════
    //  FOLLOWS
    // ══════════════════════════════════════════════

    /**
     * Toggle follow on a doctor. Returns ['following' => bool].
     */
    public function toggleFollow(string $followerId, string $followingId): array
    {
        if ($followerId === $followingId) {
            return ['following' => false, 'error' => 'Cannot follow yourself'];
        }

        return DB::transaction(function () use ($followerId, $followingId) {
            $existing = DoctorFollow::where('follower_id', $followerId)
                ->where('following_id', $followingId)
                ->first();

            if ($existing) {
                $newState = !$existing->is_active;
                $existing->update(['is_active' => $newState]);
                return ['following' => $newState];
            }

            DoctorFollow::create([
                'follower_id'  => $followerId,
                'following_id' => $followingId,
            ]);

            return ['following' => true];
        });
    }

    /**
     * Get follow counts for a user.
     */
    public function followCounts(string $userId): array
    {
        return [
            'followers'  => DoctorFollow::where('following_id', $userId)->where('is_active', true)->count(),
            'following'  => DoctorFollow::where('follower_id', $userId)->where('is_active', true)->count(),
        ];
    }

    /**
     * Check if user A follows user B.
     */
    public function isFollowing(string $followerId, string $followingId): bool
    {
        return DoctorFollow::where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->where('is_active', true)
            ->exists();
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

        // Batch-load engagement flags in two queries (prevents N+1)
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
     * Collect the target comment id + all descendant reply ids (any depth).
     *
     * @return array<int, string>
     */
    private function collectDescendantCommentIds(string $rootId): array
    {
        $allIds = [$rootId];
        $frontier = [$rootId];

        while (!empty($frontier)) {
            $children = MedStreamComment::whereIn('parent_id', $frontier)
                ->pluck('id')
                ->toArray();

            $children = array_values(array_diff($children, $allIds));

            if (empty($children)) {
                break;
            }

            $allIds = array_merge($allIds, $children);
            $frontier = $children;
        }

        return $allIds;
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
            // Capture metadata BEFORE move() — UploadedFile loses access to the
            // original tmp path after move, causing getSize()/getClientOriginalName() to throw.
            $originalName = $file->getClientOriginalName();
            $originalSize = $file->getSize();
            $originalExt  = $file->getClientOriginalExtension() ?: 'mp4';

            $tempName = Str::uuid() . '.' . $originalExt;
            $tempPath = storage_path('app/temp/' . $tempName);

            // Ensure temp directory exists
            if (!is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0755, true);
            }

            $file->move(dirname($tempPath), basename($tempPath));

            $placeholder = [
                'id'     => Str::uuid()->toString(),
                'type'   => 'video',
                'name'   => $originalName,
                'size'   => $originalSize ?: filesize($tempPath),
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

    /**
     * Notify post author about a new like (fire-and-forget).
     */
    private function notifyPostAuthorAboutLike(string $likerId, string $postId): void
    {
        try {
            $post = MedStreamPost::with('author:id,fullname,avatar')->find($postId);
            $liker = User::find($likerId);

            if ($post && $liker && $post->author && $post->author_id !== $likerId) {
                $post->author->notify(
                    new PostLikedNotification($post, $liker)
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Post like notification failed: ' . $e->getMessage());
        }
    }
}
