# MedGama Backend — Controller Kod Referansı (Bölüm 2)

**Tarih:** 19 Şubat 2026  
**Bu doküman `backend-code-reference.md` dosyasının devamıdır.**

---

## 2.5 AppointmentController

**Dosya:** `app/Http/Controllers/Api/AppointmentController.php`  
**Route Prefix:** `/api/appointments`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\User;
use Illuminate\Http\Request;
use App\Notifications\AppointmentBookedNotification;
use App\Notifications\AppointmentConfirmedNotification;
use App\Notifications\AppointmentCancelledNotification;

class AppointmentController extends Controller
{
    /**
     * GET /api/appointments
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Appointment::active()->with(['patient:id,fullname,avatar,email', 'doctor:id,fullname,avatar', 'clinic:id,fullname']);

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->when($request->status, fn($q, $v) => $q->where('status', $v))
              ->when($request->date, fn($q, $v) => $q->whereDate('appointment_date', $v))
              ->when($request->doctor_id, fn($q, $v) => $q->where('doctor_id', $v))
              ->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v));

        $appointments = $query->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($appointments);
    }

    /**
     * GET /api/appointments/{id}
     */
    public function show(Request $request, string $id)
    {
        $appointment = Appointment::active()
            ->with(['patient:id,fullname,avatar,email,mobile', 'doctor:id,fullname,avatar', 'clinic:id,fullname', 'slot'])
            ->findOrFail($id);

        return response()->json(['appointment' => $appointment]);
    }

    /**
     * POST /api/appointments
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $isDoctor = in_array($user->role_id, ['doctor', 'clinicOwner']);

        $rules = [
            'doctor_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'appointment_type' => 'required|in:inPerson,online',
            'slot_id' => 'sometimes|uuid|exists:calendar_slots,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'confirmation_note' => 'sometimes|string|max:500',
        ];

        if ($isDoctor) {
            $rules['patient_id'] = 'sometimes|uuid|exists:users,id';
            $rules['patient_name'] = 'required|string|max:255';
            $rules['patient_email'] = 'required|email|max:255';
            $rules['patient_phone'] = 'sometimes|string|max:50';
            $rules['patient_dob'] = 'sometimes|date';
        } else {
            $rules['patient_id'] = 'required|uuid|exists:users,id';
        }

        $validated = $request->validate($rules);

        if ($isDoctor && empty($validated['patient_id'])) {
            $patient = User::where('email', $validated['patient_email'])->first();

            if (!$patient) {
                $patient = User::create([
                    'email' => $validated['patient_email'],
                    'fullname' => $validated['patient_name'],
                    'mobile' => $validated['patient_phone'] ?? null,
                    'date_of_birth' => $validated['patient_dob'] ?? null,
                    'role_id' => 'patient',
                    'password' => bcrypt(\Str::random(32)),
                ]);
            }

            $validated['patient_id'] = $patient->id;
        }

        $appointmentData = collect($validated)->only([
            'patient_id', 'doctor_id', 'clinic_id', 'appointment_type',
            'slot_id', 'appointment_date', 'appointment_time', 'confirmation_note',
        ])->toArray();

        $appointmentData['status'] = 'pending';
        $appointmentData['created_by'] = $user->id;

        if (!empty($appointmentData['slot_id'])) {
            $slot = CalendarSlot::active()->findOrFail($appointmentData['slot_id']);
            if (!$slot->is_available) {
                return response()->json(['message' => 'This time slot is no longer available.'], 422);
            }
            $slot->update(['is_available' => false]);
        }

        $appointment = Appointment::create($appointmentData);
        $appointment->load(['patient', 'doctor']);

        try {
            if ($appointment->patient) {
                $appointment->patient->notify(
                    new AppointmentBookedNotification($appointment, 'patient')
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked patient notification failed: ' . $e->getMessage());
        }

        try {
            if ($appointment->doctor) {
                $appointment->doctor->notify(
                    new AppointmentBookedNotification($appointment, 'doctor')
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked doctor notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'appointment' => $appointment->load(['patient:id,fullname,avatar', 'doctor:id,fullname,avatar']),
        ], 201);
    }

    /**
     * PUT /api/appointments/{id}
     */
    public function update(Request $request, string $id)
    {
        $appointment = Appointment::active()->findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,cancelled,completed',
            'confirmation_note' => 'sometimes|string|max:500',
            'doctor_note' => 'sometimes|string',
            'video_conference_link' => 'sometimes|string|url',
        ]);

        $oldStatus = $appointment->status;
        $appointment->update($validated);
        $appointment->load(['patient', 'doctor']);

        if (isset($validated['status']) && $validated['status'] === 'cancelled' && $appointment->slot_id) {
            CalendarSlot::where('id', $appointment->slot_id)->update(['is_available' => true]);
        }

        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $cancelledBy = $request->user()?->isDoctor() ? 'doctor' : ($request->user()?->isPatient() ? 'patient' : 'system');

            try {
                if ($validated['status'] === 'confirmed') {
                    if ($appointment->patient) {
                        $appointment->patient->notify(
                            new AppointmentConfirmedNotification($appointment)
                        );
                    }
                } elseif ($validated['status'] === 'cancelled') {
                    if ($appointment->patient) {
                        $appointment->patient->notify(
                            new AppointmentCancelledNotification($appointment, 'patient', $cancelledBy)
                        );
                    }
                    if ($appointment->doctor) {
                        $appointment->doctor->notify(
                            new AppointmentCancelledNotification($appointment, 'doctor', $cancelledBy)
                        );
                    }
                }
            } catch (\Throwable $e) {
                \Log::warning('Appointment status notification failed: ' . $e->getMessage());
            }
        }

        return response()->json(['appointment' => $appointment->fresh()]);
    }

    /**
     * DELETE /api/appointments/{id}
     */
    public function destroy(string $id)
    {
        $appointment = Appointment::active()->findOrFail($id);

        if ($appointment->slot_id) {
            CalendarSlot::where('id', $appointment->slot_id)->update(['is_available' => true]);
        }

        $appointment->update(['is_active' => false]);

        return response()->json(['message' => 'Appointment deleted.']);
    }
}
```

---

## 2.6 CalendarSlotController

**Dosya:** `app/Http/Controllers/Api/CalendarSlotController.php`  
**Route Prefix:** `/api/calendar-slots`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarSlot;
use Illuminate\Http\Request;

class CalendarSlotController extends Controller
{
    /**
     * GET /api/calendar-slots
     */
    public function index(Request $request)
    {
        $query = CalendarSlot::active()->with(['doctor:id,fullname,avatar', 'clinic:id,fullname']);

        $query->when($request->doctor_id, fn($q, $v) => $q->where('doctor_id', $v))
              ->when($request->clinic_id, fn($q, $v) => $q->where('clinic_id', $v))
              ->when($request->date, fn($q, $v) => $q->whereDate('slot_date', $v))
              ->when($request->available, fn($q) => $q->available());

        $slots = $query->orderBy('slot_date')->orderBy('start_time')
            ->paginate($request->per_page ?? 50);

        return response()->json($slots);
    }

    /**
     * POST /api/calendar-slots
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'slot_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|string',
            'duration_minutes' => 'sometimes|integer|min:5|max:480',
        ]);

        $validated['is_available'] = true;

        $slot = CalendarSlot::create($validated);

        return response()->json(['slot' => $slot], 201);
    }

    /**
     * POST /api/calendar-slots/bulk
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'slots' => 'required|array|min:1',
            'slots.*.slot_date' => 'required|date|after_or_equal:today',
            'slots.*.start_time' => 'required|string',
            'slots.*.duration_minutes' => 'sometimes|integer|min:5|max:480',
        ]);

        $created = [];
        foreach ($validated['slots'] as $slotData) {
            $created[] = CalendarSlot::create([
                'doctor_id' => $validated['doctor_id'],
                'clinic_id' => $validated['clinic_id'] ?? null,
                'slot_date' => $slotData['slot_date'],
                'start_time' => $slotData['start_time'],
                'duration_minutes' => $slotData['duration_minutes'] ?? 30,
                'is_available' => true,
            ]);
        }

        return response()->json(['slots' => $created, 'count' => count($created)], 201);
    }

    /**
     * PUT /api/calendar-slots/{id}
     */
    public function update(Request $request, string $id)
    {
        $slot = CalendarSlot::active()->findOrFail($id);

        $validated = $request->validate([
            'slot_date' => 'sometimes|date',
            'start_time' => 'sometimes|string',
            'duration_minutes' => 'sometimes|integer|min:5|max:480',
            'is_available' => 'sometimes|boolean',
        ]);

        $slot->update($validated);

        return response()->json(['slot' => $slot->fresh()]);
    }

    /**
     * DELETE /api/calendar-slots/{id}
     */
    public function destroy(string $id)
    {
        $slot = CalendarSlot::active()->findOrFail($id);
        $slot->update(['is_active' => false]);

        return response()->json(['message' => 'Slot deleted.']);
    }
}
```

---

## 2.7 MedStreamController

**Dosya:** `app/Http/Controllers/Api/MedStreamController.php`  
**Route Prefix:** `/api/medstream`

```php
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
            'photos.*'   => 'file|mimes:jpg,jpeg,png,gif,bmp,webp,svg,heic,heif|max:10240',
            'videos'     => 'sometimes|array',
            'videos.*'   => 'file|mimetypes:video/mp4,video/quicktime,video/webm,video/avi|max:102400',
            'papers'     => 'sometimes|array',
            'papers.*'   => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,csv|max:20480',
        ]);

        $mediaUrl = $validated['media_url'] ?? null;
        $uploadedFiles = [];

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $result = MediaOptimizer::processImage($file);
                $uploadedFiles[] = $result;
                if (!$mediaUrl) {
                    $mediaUrl = $result['medium'] ?? $result['original'];
                }
            }
        }

        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $file) {
                $result = MediaOptimizer::processVideo($file);
                $uploadedFiles[] = $result;
                if (!$mediaUrl) {
                    $mediaUrl = $result['thumb'] ?? $result['original'];
                }
            }
        }

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

        $this->deletePostMedia($post);

        MedStreamComment::where('post_id', $id)->update(['is_active' => false]);
        MedStreamLike::where('post_id', $id)->update(['is_active' => false]);
        MedStreamReport::where('post_id', $id)->update(['is_active' => false]);
        MedStreamEngagementCounter::where('post_id', $id)->delete();

        $post->update(['is_active' => false, 'is_hidden' => true]);

        return response()->json(['message' => 'Post deleted.']);
    }

    private function deletePostMedia(MedStreamPost $post): void
    {
        try {
            $mediaItems = $post->media;
            if (!is_array($mediaItems) || empty($mediaItems)) return;

            foreach ($mediaItems as $item) {
                foreach (['original', 'medium', 'thumb'] as $variant) {
                    $url = $item[$variant] ?? null;
                    if (!$url || !is_string($url)) continue;

                    $storagePath = $this->urlToStoragePath($url);
                    if ($storagePath && \Storage::disk('public')->exists($storagePath)) {
                        \Storage::disk('public')->delete($storagePath);
                    }
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to delete post media files', ['post_id' => $post->id, 'error' => $e->getMessage()]);
        }
    }

    private function urlToStoragePath(string $url): ?string
    {
        $marker = '/storage/';
        $pos = strpos($url, $marker);
        if ($pos === false) return null;
        return substr($url, $pos + strlen($marker));
    }

    // ── Comments ──

    public function comments(Request $request, string $postId)
    {
        $comments = MedStreamComment::active()
            ->where('post_id', $postId)
            ->where('is_hidden', false)
            ->whereNull('parent_id')
            ->with(['author:id,fullname,avatar', 'replies' => fn($q) => $q->with('author:id,fullname,avatar')->orderBy('created_at')])
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($comments);
    }

    public function storeComment(Request $request, string $postId)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:2000',
            'parent_id' => 'sometimes|nullable|uuid|exists:med_stream_comments,id',
        ]);

        $post = MedStreamPost::with('author:id,fullname')->findOrFail($postId);

        $comment = MedStreamComment::create([
            'post_id' => $postId,
            'author_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
        ]);

        MedStreamEngagementCounter::where('post_id', $postId)->increment('comment_count');

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
                MedStreamEngagementCounter::where('post_id', $postId)->where('like_count', '>', 0)->decrement('like_count');
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

        if (in_array($validated['admin_status'], ['hidden', 'deleted'])) {
            MedStreamPost::where('id', $report->post_id)->update(['is_hidden' => true]);
        }

        return response()->json(['report' => $report->fresh()]);
    }
}
```

---

## 2.8 MessageController

**Dosya:** `app/Http/Controllers/Api/MessageController.php`  
**Route Prefix:** `/api/messages`

```php
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
    /**
     * GET /api/messages/conversations
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

        $conversation = Conversation::create([
            'type' => 'group',
            'title' => $request->title,
            'clinic_id' => $user->clinic_id,
        ]);

        $conversation->participants()->create([
            'user_id' => $user->id,
            'role' => 'admin',
        ]);

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

    public function updateConversation(Request $request, string $id)
    {
        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($id);

        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($request->has('title') && $conversation->type === 'group' && $participant->role === 'admin') {
            $conversation->update(['title' => $request->title]);
        }

        if ($request->has('is_muted')) {
            $participant->update(['is_muted' => (bool) $request->is_muted]);
        }
        if ($request->has('is_archived')) {
            $participant->update(['is_archived' => (bool) $request->is_archived]);
        }

        return response()->json(['message' => 'Updated', 'conversation' => $this->formatConversation($conversation->fresh(), $user->id)]);
    }

    public function deleteConversation(Request $request, string $id)
    {
        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($id);

        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['is_active' => false]);

        if ($conversation->activeParticipants()->count() === 0) {
            $conversation->update(['is_active' => false]);
        }

        return response()->json(['message' => 'Conversation left']);
    }

    /**
     * GET /api/messages/conversations/{conversationId}/messages
     */
    public function messages(Request $request, string $conversationId)
    {
        $user = $request->user();

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

        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        $messages->getCollection()->transform(fn($msg) => $this->formatMessage($msg, $user->id));

        return response()->json($messages);
    }

    /**
     * POST /api/messages/conversations/{conversationId}/messages
     */
    public function sendMessage(Request $request, string $conversationId)
    {
        $request->validate([
            'body' => 'nullable|string|max:5000',
            'type' => 'in:text,image,file,video,audio',
            'reply_to_id' => 'nullable|uuid|exists:messages,id',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:51200',
        ]);

        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($conversationId);

        $hasAttachments = $request->hasFile('attachments');
        $body = $request->body;

        if (!$body && !$hasAttachments) {
            return response()->json(['message' => 'Message body or attachments required'], 422);
        }

        $type = $request->type ?? 'text';
        if ($hasAttachments && $type === 'text') {
            $firstFile = $request->file('attachments')[0];
            $mime = $firstFile->getMimeType();
            if (str_starts_with($mime, 'image/')) $type = 'image';
            elseif (str_starts_with($mime, 'video/')) $type = 'video';
            elseif (str_starts_with($mime, 'audio/')) $type = 'audio';
            else $type = 'file';
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'reply_to_id' => $request->reply_to_id,
            'body' => $body,
            'type' => $type,
        ]);

        if ($hasAttachments) {
            foreach ($request->file('attachments') as $file) {
                $originalName = $file->getClientOriginalName();
                $mime = $file->getMimeType();
                $isImage = str_starts_with($mime, 'image/') && !str_contains($mime, 'svg');
                $dir = 'messages/' . $conversation->id;
                $thumbPath = null;

                if ($isImage) {
                    $path = $this->optimizeAndStoreImage($file, $dir);
                    $thumbPath = $this->createThumbnail($file, $dir);
                } else {
                    $path = $file->store($dir, 'public');
                }

                MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_name' => $originalName,
                    'file_path' => $path,
                    'file_type' => $mime,
                    'file_size' => Storage::disk('public')->size($path),
                    'thumb_path' => $thumbPath,
                ]);
            }
        }

        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

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

    public function deleteMessage(Request $request, string $messageId)
    {
        $user = $request->user();
        $message = Message::active()->where('sender_id', $user->id)->findOrFail($messageId);

        $message->update(['is_active' => false]);
        $message->delete();

        return response()->json(['message' => 'Message deleted']);
    }

    /**
     * POST /api/messages/conversations/{conversationId}/read
     */
    public function markRead(Request $request, string $conversationId)
    {
        $user = $request->user();

        $conversation = Conversation::active()
            ->forUser($user->id)
            ->findOrFail($conversationId);

        $conversation->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return response()->json(['message' => 'Marked as read']);
    }

    /**
     * GET /api/messages/search
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

    /**
     * GET /api/messages/unread-count
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

    // ── Helpers ──

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

    private function optimizeAndStoreImage($file, string $dir): string
    {
        $maxWidth = 1920;
        $maxHeight = 1920;
        $quality = 82;

        $image = @imagecreatefromstring(file_get_contents($file->getRealPath()));
        if (!$image) {
            return $file->store($dir, 'public');
        }

        $origW = imagesx($image);
        $origH = imagesy($image);

        if ($origW > $maxWidth || $origH > $maxHeight) {
            $ratio = min($maxWidth / $origW, $maxHeight / $origH);
            $newW = (int) round($origW * $ratio);
            $newH = (int) round($origH * $ratio);
            $resized = imagecreatetruecolor($newW, $newH);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
            imagedestroy($image);
            $image = $resized;
        }

        $filename = Str::uuid() . '.webp';
        $storagePath = $dir . '/' . $filename;
        $fullPath = Storage::disk('public')->path($storagePath);

        $dirPath = dirname($fullPath);
        if (!is_dir($dirPath)) {
            mkdir($dirPath, 0755, true);
        }

        imagewebp($image, $fullPath, $quality);
        imagedestroy($image);

        return $storagePath;
    }

    private function createThumbnail($file, string $dir): ?string
    {
        $thumbSize = 200;

        $image = @imagecreatefromstring(file_get_contents($file->getRealPath()));
        if (!$image) return null;

        $origW = imagesx($image);
        $origH = imagesy($image);
        $ratio = min($thumbSize / $origW, $thumbSize / $origH);
        $newW = max(1, (int) round($origW * $ratio));
        $newH = max(1, (int) round($origH * $ratio));

        $thumb = imagecreatetruecolor($newW, $newH);
        imagealphablending($thumb, false);
        imagesavealpha($thumb, true);
        imagecopyresampled($thumb, $image, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
        imagedestroy($image);

        $filename = Str::uuid() . '_thumb.webp';
        $storagePath = $dir . '/' . $filename;
        $fullPath = Storage::disk('public')->path($storagePath);

        $dirPath = dirname($fullPath);
        if (!is_dir($dirPath)) {
            mkdir($dirPath, 0755, true);
        }

        imagewebp($thumb, $fullPath, 60);
        imagedestroy($thumb);

        return $storagePath;
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
```

---

## 2.9 NotificationController

**Dosya:** `app/Http/Controllers/Api/NotificationController.php`  
**Route Prefix:** `/api/notifications`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $user->notifications();

        if ($request->boolean('unread')) {
            $query = $user->unreadNotifications();
        }

        if ($request->filled('type')) {
            $query->whereJsonContains('data->type', $request->type);
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($notifications);
    }

    /**
     * GET /api/notifications/unread-count
     */
    public function unreadCount(Request $request)
    {
        $count = $request->user()->unreadNotifications()->count();
        return response()->json(['unread_count' => $count]);
    }

    /**
     * PUT /api/notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * PUT /api/notifications/read-all
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * DELETE /api/notifications/{id}
     */
    public function destroy(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }

    /**
     * DELETE /api/notifications
     */
    public function destroyAll(Request $request)
    {
        $request->user()
            ->notifications()
            ->whereNotNull('read_at')
            ->delete();

        return response()->json(['message' => 'Read notifications cleared.']);
    }
}
```

---

## 2.10 CatalogController

**Dosya:** `app/Http/Controllers/Api/CatalogController.php`  
**Route Prefix:** `/api/catalog`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use App\Models\City;
use App\Models\DiseaseCondition;
use App\Models\SymptomSpecialtyMapping;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function specialties(Request $request)
    {
        $specialties = Specialty::active()
            ->ordered()
            ->when($request->code, fn($q, $v) => $q->where('code', $v))
            ->get();

        return response()->json(['specialties' => $specialties]);
    }

    public function storeSpecialty(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:specialties,code',
            'display_order' => 'sometimes|integer',
            'translations' => 'required|array',
        ]);

        $specialty = Specialty::create($validated);
        return response()->json(['specialty' => $specialty], 201);
    }

    public function updateSpecialty(Request $request, string $id)
    {
        $specialty = Specialty::active()->findOrFail($id);

        $validated = $request->validate([
            'display_order' => 'sometimes|integer',
            'translations' => 'sometimes|array',
        ]);

        $specialty->update($validated);
        return response()->json(['specialty' => $specialty->fresh()]);
    }

    public function destroySpecialty(string $id)
    {
        Specialty::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'Specialty deleted.']);
    }

    public function cities(Request $request)
    {
        $cities = City::active()
            ->when($request->country_id, fn($q, $v) => $q->byCountry($v))
            ->when($request->code, fn($q, $v) => $q->where('code', $v))
            ->get();

        return response()->json(['cities' => $cities]);
    }

    public function storeCity(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'country_id' => 'required|integer',
            'translations' => 'required|array',
        ]);

        $city = City::create($validated);
        return response()->json(['city' => $city], 201);
    }

    public function updateCity(Request $request, string $id)
    {
        $city = City::active()->findOrFail($id);

        $validated = $request->validate([
            'translations' => 'sometimes|array',
        ]);

        $city->update($validated);
        return response()->json(['city' => $city->fresh()]);
    }

    public function destroyCity(string $id)
    {
        City::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'City deleted.']);
    }

    public function diseases(Request $request)
    {
        $diseases = DiseaseCondition::active()
            ->when($request->code, fn($q, $v) => $q->where('code', $v))
            ->get();

        return response()->json(['diseases' => $diseases]);
    }

    public function storeDisease(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:disease_conditions,code',
            'recommended_specialty_ids' => 'sometimes|array',
            'translations' => 'required|array',
        ]);

        $disease = DiseaseCondition::create($validated);
        return response()->json(['disease' => $disease], 201);
    }

    public function updateDisease(Request $request, string $id)
    {
        $disease = DiseaseCondition::active()->findOrFail($id);

        $validated = $request->validate([
            'recommended_specialty_ids' => 'sometimes|array',
            'translations' => 'sometimes|array',
        ]);

        $disease->update($validated);
        return response()->json(['disease' => $disease->fresh()]);
    }

    public function symptoms(Request $request)
    {
        $symptoms = SymptomSpecialtyMapping::active()
            ->when($request->symptom, fn($q, $v) => $q->where('symptom', 'like', "%{$v}%"))
            ->get();

        return response()->json(['symptoms' => $symptoms]);
    }

    public function storeSymptom(Request $request)
    {
        $validated = $request->validate([
            'symptom' => 'required|string|max:100|unique:symptom_specialty_mappings,symptom',
            'specialty_ids' => 'required|array',
            'translations' => 'required|array',
        ]);

        $mapping = SymptomSpecialtyMapping::create($validated);
        return response()->json(['symptom' => $mapping], 201);
    }

    public function updateSymptom(Request $request, string $id)
    {
        $mapping = SymptomSpecialtyMapping::active()->findOrFail($id);

        $validated = $request->validate([
            'specialty_ids' => 'sometimes|array',
            'translations' => 'sometimes|array',
        ]);

        $mapping->update($validated);
        return response()->json(['symptom' => $mapping->fresh()]);
    }
}
```

---

## 2.11 CrmController

**Dosya:** `app/Http/Controllers/Api/CrmController.php`  
**Route Prefix:** `/api/crm`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmTag;
use App\Models\CrmProcessStage;
use App\Models\ArchivedClinicRecord;
use Illuminate\Http\Request;

class CrmController extends Controller
{
    public function tags(Request $request)
    {
        $user = $request->user();
        $query = CrmTag::active();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v));

        return response()->json($query->orderByDesc('created_at')->paginate($request->per_page ?? 50));
    }

    public function storeTag(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'tag' => 'required|string|max:100',
        ]);

        $tag = CrmTag::create([
            'doctor_id' => $request->user()->id,
            'patient_id' => $validated['patient_id'],
            'clinic_id' => $request->user()->clinic_id,
            'tag' => $validated['tag'],
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['tag' => $tag], 201);
    }

    public function destroyTag(string $id)
    {
        CrmTag::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'Tag deleted.']);
    }

    public function stages(Request $request)
    {
        $user = $request->user();
        $query = CrmProcessStage::active();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v));

        return response()->json($query->orderByDesc('created_at')->paginate($request->per_page ?? 50));
    }

    public function storeStage(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'stage' => 'required|string|max:100',
        ]);

        $stage = CrmProcessStage::create([
            'doctor_id' => $request->user()->id,
            'patient_id' => $validated['patient_id'],
            'clinic_id' => $request->user()->clinic_id,
            'stage' => $validated['stage'],
            'started_at' => now()->toDateString(),
            'updated_by' => $request->user()->id,
        ]);

        return response()->json(['stage' => $stage], 201);
    }

    public function updateStage(Request $request, string $id)
    {
        $stage = CrmProcessStage::active()->findOrFail($id);

        $validated = $request->validate([
            'stage' => 'required|string|max:100',
        ]);

        $stage->update([
            'stage' => $validated['stage'],
            'updated_by' => $request->user()->id,
        ]);

        return response()->json(['stage' => $stage->fresh()]);
    }

    public function archivedRecords(Request $request)
    {
        $user = $request->user();
        $query = ArchivedClinicRecord::active()->with(['formerDoctor:id,fullname', 'archivedPatient:id,fullname']);

        if ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        return response()->json($query->orderByDesc('archived_at')->paginate($request->per_page ?? 20));
    }

    public function storeArchivedRecord(Request $request)
    {
        $validated = $request->validate([
            'former_doctor_id' => 'required|uuid|exists:users,id',
            'archived_patient_id' => 'required|uuid|exists:users,id',
            'record_references' => 'sometimes|array',
        ]);

        $record = ArchivedClinicRecord::create([
            'former_doctor_id' => $validated['former_doctor_id'],
            'clinic_id' => $request->user()->clinic_id,
            'archived_patient_id' => $validated['archived_patient_id'],
            'record_references' => $validated['record_references'] ?? [],
            'archived_at' => now()->toDateString(),
        ]);

        return response()->json(['record' => $record], 201);
    }
}
```

---

## 2.12 DigitalAnamnesisController

**Dosya:** `app/Http/Controllers/Api/DigitalAnamnesisController.php`  
**Route Prefix:** `/api/anamnesis`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DigitalAnamnesis;
use Illuminate\Http\Request;

class DigitalAnamnesisController extends Controller
{
    public function show(Request $request, string $patientId)
    {
        $anamnesis = DigitalAnamnesis::active()->where('patient_id', $patientId)->first();

        if (!$anamnesis) {
            return response()->json(['anamnesis' => null]);
        }

        return response()->json(['anamnesis' => $anamnesis]);
    }

    public function upsert(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'answers' => 'required|array',
        ]);

        $anamnesis = DigitalAnamnesis::updateOrCreate(
            ['patient_id' => $validated['patient_id']],
            [
                'answers' => $validated['answers'],
                'doctor_id' => $request->user()->isDoctor() ? $request->user()->id : null,
                'clinic_id' => $request->user()->clinic_id,
                'last_updated_by' => $request->user()->id,
            ]
        );

        return response()->json(['anamnesis' => $anamnesis]);
    }
}
```

---

## 2.13 PatientRecordController

**Dosya:** `app/Http/Controllers/Api/PatientRecordController.php`  
**Route Prefix:** `/api/patient-records`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use Illuminate\Http\Request;

class PatientRecordController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = PatientRecord::active()->with(['patient:id,fullname,avatar', 'doctor:id,fullname,avatar']);

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v))
              ->when($request->record_type, fn($q, $v) => $q->where('record_type', $v));

        return response()->json($query->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'file_url' => 'required|string|url',
            'record_type' => 'required|in:labResult,report,scan,other',
            'description' => 'sometimes|string|max:500',
        ]);

        $validated['doctor_id'] = $request->user()->id;
        $validated['upload_date'] = now()->toDateString();

        $record = PatientRecord::create($validated);

        return response()->json(['record' => $record], 201);
    }

    public function show(string $id)
    {
        return response()->json(['record' => PatientRecord::active()->with(['patient:id,fullname', 'doctor:id,fullname'])->findOrFail($id)]);
    }

    public function destroy(string $id)
    {
        PatientRecord::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'Record deleted.']);
    }
}
```

---

## 2.14 MediaStreamController

**Dosya:** `app/Http/Controllers/Api/MediaStreamController.php`  
**Route:** `GET /api/media/stream/{path}`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaStreamController extends Controller
{
    /**
     * Stream a media file with Range request support (HTTP 206 Partial Content).
     * This enables video seeking in browsers even when the web server
     * (e.g. php artisan serve) does not natively support Range requests.
     *
     * GET /api/media/stream/{path}
     */
    public function stream(Request $request, string $path)
    {
        $disk = Storage::disk('public');

        if (!$disk->exists($path)) {
            abort(404, 'File not found');
        }

        $fullPath = $disk->path($path);
        $fileSize = filesize($fullPath);
        $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

        $start = 0;
        $end = $fileSize - 1;
        $statusCode = 200;
        $headers = [
            'Content-Type'   => $mimeType,
            'Accept-Ranges'  => 'bytes',
            'Cache-Control'  => 'public, max-age=86400',
            'Content-Disposition' => 'inline',
        ];

        $rangeHeader = $request->header('Range');
        if ($rangeHeader) {
            $statusCode = 206;

            if (preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
                $start = intval($matches[1]);
                if (!empty($matches[2])) {
                    $end = intval($matches[2]);
                }
            }

            if ($start > $end || $start >= $fileSize) {
                return response('', 416, [
                    'Content-Range' => "bytes */{$fileSize}",
                ]);
            }

            $end = min($end, $fileSize - 1);
            $length = $end - $start + 1;

            $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
            $headers['Content-Length'] = $length;
        } else {
            $headers['Content-Length'] = $fileSize;
        }

        $response = new StreamedResponse(function () use ($fullPath, $start, $end) {
            $handle = fopen($fullPath, 'rb');
            if ($handle === false) {
                return;
            }

            fseek($handle, $start);
            $remaining = $end - $start + 1;
            $bufferSize = 8192;

            while ($remaining > 0 && !feof($handle)) {
                $read = min($bufferSize, $remaining);
                $data = fread($handle, $read);
                if ($data === false) {
                    break;
                }
                echo $data;
                $remaining -= strlen($data);
                flush();
            }

            fclose($handle);
        }, $statusCode, $headers);

        return $response;
    }
}
```

---

*Bu doküman MedGama backend kaynak kodunun referans kopyasıdır — Bölüm 2.*  
*Oluşturulma tarihi: 19 Şubat 2026*
