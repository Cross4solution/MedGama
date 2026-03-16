<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Clinic;
use App\Models\MedStreamPost;
use App\Models\MedStreamReport;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Notifications\ReviewModerationNotification;
use App\Notifications\VerificationApprovedNotification;
use App\Notifications\VerificationRejectedNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SuperAdminService
{
    private const CACHE_TTL = 900; // 15 minutes

    // ══════════════════════════════════════════════
    //  GLOBAL DASHBOARD
    // ══════════════════════════════════════════════

    /**
     * Platform-wide summary: appointments, users, MedStream stats.
     */
    public function getGlobalDashboard(): array
    {
        return Cache::remember('superadmin:dashboard', self::CACHE_TTL, function () {
            $now = Carbon::now();
            $startOfMonth = $now->copy()->startOfMonth();
            $endOfMonth = $now->copy()->endOfMonth();

            // ── User counts ──
            $userCounts = User::query()
                ->where('is_active', true)
                ->selectRaw("
                    COUNT(*) as total_users,
                    SUM(CASE WHEN role_id = 'doctor' THEN 1 ELSE 0 END) as total_doctors,
                    SUM(CASE WHEN role_id = 'patient' THEN 1 ELSE 0 END) as total_patients,
                    SUM(CASE WHEN role_id = 'clinicOwner' THEN 1 ELSE 0 END) as total_clinic_owners,
                    SUM(CASE WHEN role_id = 'doctor' AND is_verified = true THEN 1 ELSE 0 END) as verified_doctors,
                    SUM(CASE WHEN role_id = 'doctor' AND is_verified = false THEN 1 ELSE 0 END) as unverified_doctors
                ")
                ->first();

            // ── Appointment stats (this month) ──
            $appointmentStats = Appointment::query()
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                ")
                ->first();

            // ── Clinic counts ──
            $totalClinics = Clinic::active()->count();
            $newClinicsThisMonth = Clinic::active()->whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

            // ── MedStream stats ──
            $postCount = MedStreamPost::where('is_active', true)->count();
            $pendingReports = MedStreamReport::where('admin_status', 'pending')->count();

            // ── New users this month ──
            $newUsersThisMonth = User::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

            return [
                'period' => $now->format('Y-m'),
                'users' => [
                    'total'              => (int) $userCounts->total_users,
                    'doctors'            => (int) $userCounts->total_doctors,
                    'patients'           => (int) $userCounts->total_patients,
                    'clinic_owners'      => (int) $userCounts->total_clinic_owners,
                    'verified_doctors'   => (int) $userCounts->verified_doctors,
                    'unverified_doctors' => (int) $userCounts->unverified_doctors,
                    'new_this_month'     => $newUsersThisMonth,
                ],
                'clinics' => [
                    'total'          => $totalClinics,
                    'new_this_month' => $newClinicsThisMonth,
                ],
                'appointments' => [
                    'total'     => (int) $appointmentStats->total,
                    'completed' => (int) $appointmentStats->completed,
                    'confirmed' => (int) $appointmentStats->confirmed,
                    'pending'   => (int) $appointmentStats->pending,
                    'cancelled' => (int) $appointmentStats->cancelled,
                ],
                'medstream' => [
                    'total_posts'     => $postCount,
                    'pending_reports' => $pendingReports,
                ],
            ];
        });
    }

    // ══════════════════════════════════════════════
    //  DOCTOR VERIFICATION
    // ══════════════════════════════════════════════

    /**
     * List doctors pending verification or filter by status.
     */
    public function listDoctors(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->where('role_id', 'doctor')
            ->where('is_active', true)
            ->when(isset($filters['verified']), function ($q) use ($filters) {
                $q->where('is_verified', filter_var($filters['verified'], FILTER_VALIDATE_BOOLEAN));
            })
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('fullname', 'ilike', "%{$search}%")
                       ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->select('id', 'fullname', 'email', 'avatar', 'is_verified', 'created_at', 'clinic_id')
            ->with('clinic:id,fullname')
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Verify or reject a doctor.
     */
    public function updateDoctorVerification(string $doctorId, bool $verified): User
    {
        $doctor = User::where('role_id', 'doctor')->findOrFail($doctorId);
        $doctor->is_verified = $verified;
        $doctor->save();

        // Clear dashboard cache
        Cache::forget('superadmin:dashboard');

        return $doctor;
    }

    // ══════════════════════════════════════════════
    //  CONTENT MODERATION (delegates to MedStreamService for reports)
    // ══════════════════════════════════════════════

    /**
     * List reported posts with reporter + post author info.
     */
    public function listReportedPosts(array $filters): LengthAwarePaginator
    {
        return MedStreamReport::query()
            ->with([
                'post:id,content,author_id,media_url,post_type,is_hidden,created_at',
                'post.author:id,fullname,avatar',
                'reporter:id,fullname,avatar',
            ])
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('admin_status', $v))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Approve a report (dismiss it — mark as reviewed, keep post visible).
     */
    public function approveReport(string $reportId): MedStreamReport
    {
        $report = MedStreamReport::findOrFail($reportId);
        $report->update(['admin_status' => 'reviewed']);
        return $report->refresh();
    }

    /**
     * Remove reported content (hide post + mark report as actioned).
     */
    public function removeReportedContent(string $reportId): MedStreamReport
    {
        $report = MedStreamReport::findOrFail($reportId);

        DB::transaction(function () use ($report) {
            $report->update(['admin_status' => 'hidden']);
            MedStreamPost::where('id', $report->post_id)->update(['is_hidden' => true]);
        });

        return $report->refresh();
    }

    /**
     * Suspend or reactivate a user.
     */
    public function suspendUser(string $userId, bool $suspend): User
    {
        $user = User::findOrFail($userId);
        $user->is_active = !$suspend;
        $user->save();

        Cache::forget('superadmin:dashboard');

        return $user;
    }

    // ══════════════════════════════════════════════
    //  GROWTH TREND (monthly registration chart)
    // ══════════════════════════════════════════════

    /**
     * Monthly registration counts for the last 12 months: users, doctors, clinics.
     */
    public function getGrowthTrend(): array
    {
        return Cache::remember('superadmin:growth-trend', self::CACHE_TTL, function () {
            $months = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $months[] = [
                    'start' => $date->copy()->startOfMonth(),
                    'end'   => $date->copy()->endOfMonth(),
                    'label' => $date->format('M Y'),
                    'key'   => $date->format('Y-m'),
                ];
            }

            // Aggregate user registrations per month
            $userRows = User::query()
                ->where('created_at', '>=', $months[0]['start'])
                ->selectRaw("
                    TO_CHAR(created_at, 'YYYY-MM') as month,
                    COUNT(*) as total,
                    SUM(CASE WHEN role_id = 'doctor' THEN 1 ELSE 0 END) as doctors,
                    SUM(CASE WHEN role_id = 'patient' THEN 1 ELSE 0 END) as patients
                ")
                ->groupBy(DB::raw("TO_CHAR(created_at, 'YYYY-MM')"))
                ->get()
                ->keyBy('month');

            // Aggregate clinic registrations per month
            $clinicRows = Clinic::query()
                ->where('created_at', '>=', $months[0]['start'])
                ->selectRaw("
                    TO_CHAR(created_at, 'YYYY-MM') as month,
                    COUNT(*) as total
                ")
                ->groupBy(DB::raw("TO_CHAR(created_at, 'YYYY-MM')"))
                ->get()
                ->keyBy('month');

            $result = [];
            foreach ($months as $m) {
                $uRow = $userRows[$m['key']] ?? null;
                $cRow = $clinicRows[$m['key']] ?? null;
                $result[] = [
                    'label'    => $m['label'],
                    'month'    => $m['key'],
                    'users'    => (int) ($uRow->total ?? 0),
                    'doctors'  => (int) ($uRow->doctors ?? 0),
                    'patients' => (int) ($uRow->patients ?? 0),
                    'clinics'  => (int) ($cRow->total ?? 0),
                ];
            }

            return $result;
        });
    }

    // ══════════════════════════════════════════════
    //  FEATURE TOGGLES (System Settings)
    // ══════════════════════════════════════════════

    /**
     * Get all system settings grouped by category.
     */
    public function getFeatureToggles(): array
    {
        $settings = SystemSetting::orderBy('group')->orderBy('key')->get();

        // If no settings exist yet, seed defaults
        if ($settings->isEmpty()) {
            $this->seedDefaultSettings();
            $settings = SystemSetting::orderBy('group')->orderBy('key')->get();
        }

        return $settings->map(fn(SystemSetting $s) => [
            'id'          => $s->id,
            'key'         => $s->key,
            'value'       => $s->typed_value,
            'type'        => $s->type,
            'group'       => $s->group,
            'label'       => $s->label,
            'description' => $s->description,
            'updated_at'  => $s->updated_at?->toISOString(),
        ])->groupBy('group')->toArray();
    }

    /**
     * Update a single feature toggle.
     */
    public function updateFeatureToggle(string $key, mixed $value, string $userId): SystemSetting
    {
        $setting = SystemSetting::where('key', $key)->firstOrFail();
        $oldValue = $setting->value;

        $setting->update([
            'value'      => is_bool($value) ? ($value ? '1' : '0') : (string) $value,
            'updated_by' => $userId,
        ]);

        // Audit the change
        AuditLog::log(
            action: 'system_setting.updated',
            resourceType: 'SystemSetting',
            resourceId: $setting->id,
            oldValues: ['value' => $oldValue],
            newValues: ['value' => $setting->value],
            description: "Feature toggle '{$key}' changed",
        );

        Cache::forget('superadmin:dashboard');

        return $setting->refresh();
    }

    /**
     * Seed default feature toggle settings.
     */
    private function seedDefaultSettings(): void
    {
        $defaults = [
            // Modules
            ['key' => 'module.health_tourism',  'value' => '1', 'type' => 'boolean', 'group' => 'modules', 'label' => 'Health Tourism Mode',   'description' => 'Enable/disable health tourism features across the platform'],
            ['key' => 'module.vasco_ai',        'value' => '1', 'type' => 'boolean', 'group' => 'modules', 'label' => 'Vasco AI',               'description' => 'Enable/disable Vasco AI assistant for patients'],
            ['key' => 'module.online_payment',   'value' => '0', 'type' => 'boolean', 'group' => 'modules', 'label' => 'Online Payment',          'description' => 'Enable/disable online payment processing'],
            ['key' => 'module.telehealth',       'value' => '1', 'type' => 'boolean', 'group' => 'modules', 'label' => 'Telehealth',              'description' => 'Enable/disable telehealth video consultations'],
            ['key' => 'module.medstream',        'value' => '1', 'type' => 'boolean', 'group' => 'modules', 'label' => 'MedStream',               'description' => 'Enable/disable MedStream social feed'],
            ['key' => 'module.patient_documents','value' => '1', 'type' => 'boolean', 'group' => 'modules', 'label' => 'Patient Documents',       'description' => 'Enable/disable patient medical archive uploads'],
            // Platform
            ['key' => 'platform.maintenance_mode', 'value' => '0', 'type' => 'boolean', 'group' => 'platform', 'label' => 'Maintenance Mode',   'description' => 'Put entire platform into maintenance mode'],
            ['key' => 'platform.registration',     'value' => '1', 'type' => 'boolean', 'group' => 'platform', 'label' => 'User Registration',  'description' => 'Allow new user registrations'],
            ['key' => 'platform.max_upload_mb',    'value' => '20','type' => 'integer', 'group' => 'platform', 'label' => 'Max Upload Size (MB)','description' => 'Maximum file upload size in megabytes'],
        ];

        foreach ($defaults as $setting) {
            SystemSetting::firstOrCreate(['key' => $setting['key']], $setting);
        }
    }

    // ══════════════════════════════════════════════
    //  AUDIT LOGS
    // ══════════════════════════════════════════════

    /**
     * List audit logs with filters.
     */
    public function listAuditLogs(array $filters): LengthAwarePaginator
    {
        return AuditLog::query()
            ->with('user:id,fullname,email,avatar,role_id')
            ->when($filters['action'] ?? null, fn($q, $v) => $q->where('action', 'ilike', "%{$v}%"))
            ->when($filters['resource_type'] ?? null, fn($q, $v) => $q->where('resource_type', $v))
            ->when($filters['user_id'] ?? null, fn($q, $v) => $q->where('user_id', $v))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('action', 'ilike', "%{$search}%")
                       ->orWhere('description', 'ilike', "%{$search}%")
                       ->orWhere('resource_type', 'ilike', "%{$search}%");
                });
            })
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->where('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->where('created_at', '<=', $v))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 25);
    }

    // ══════════════════════════════════════════════
    //  VERIFICATION REQUESTS (Doc §8.3)
    // ══════════════════════════════════════════════

    /**
     * List verification requests with filters.
     */
    public function listVerificationRequests(array $filters): LengthAwarePaginator
    {
        return VerificationRequest::query()
            ->with([
                'doctor:id,fullname,email,avatar,is_verified,clinic_id',
                'doctor.doctorProfile:id,user_id,specialty,title',
                'reviewer:id,fullname',
            ])
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['doctor_id'] ?? null, fn($q, $v) => $q->where('doctor_id', $v))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->whereHas('doctor', function ($dq) use ($search) {
                    $dq->where('fullname', 'ilike', "%{$search}%")
                       ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Approve a verification request → set is_verified = true on doctor.
     */
    public function approveVerificationRequest(string $requestId, string $reviewerId): VerificationRequest
    {
        $vr = VerificationRequest::findOrFail($requestId);

        DB::transaction(function () use ($vr, $reviewerId) {
            $vr->update([
                'status'      => 'approved',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            // Mark doctor as verified
            User::where('id', $vr->doctor_id)->update(['is_verified' => true]);
        });

        // Send notification to doctor
        $vr->doctor->notify(new VerificationApprovedNotification($vr));

        // Audit log
        AuditLog::log(
            action: 'verification.approved',
            resourceType: 'VerificationRequest',
            resourceId: $vr->id,
            newValues: ['doctor_id' => $vr->doctor_id, 'document_type' => $vr->document_type],
            description: "Approved verification for doctor: {$vr->doctor->fullname}",
        );

        Cache::forget('superadmin:dashboard');

        return $vr->refresh()->load(['doctor:id,fullname,email,avatar,is_verified', 'reviewer:id,fullname']);
    }

    /**
     * Reject a verification request with reason.
     */
    public function rejectVerificationRequest(string $requestId, string $reviewerId, ?string $reason = null): VerificationRequest
    {
        $vr = VerificationRequest::findOrFail($requestId);

        $vr->update([
            'status'           => 'rejected',
            'reviewed_by'      => $reviewerId,
            'reviewed_at'      => now(),
            'rejection_reason' => $reason,
        ]);

        // Send notification to doctor
        $vr->doctor->notify(new VerificationRejectedNotification($vr));

        // Audit log
        AuditLog::log(
            action: 'verification.rejected',
            resourceType: 'VerificationRequest',
            resourceId: $vr->id,
            newValues: ['doctor_id' => $vr->doctor_id, 'reason' => $reason],
            description: "Rejected verification for doctor: {$vr->doctor->fullname}",
        );

        return $vr->refresh()->load(['doctor:id,fullname,email,avatar,is_verified', 'reviewer:id,fullname']);
    }

    /**
     * Get verification request statistics for dashboard.
     */
    public function getVerificationStats(): array
    {
        return [
            'pending'  => VerificationRequest::pending()->count(),
            'approved' => VerificationRequest::approved()->count(),
            'rejected' => VerificationRequest::rejected()->count(),
        ];
    }

    // ═══════════════════════════════════════════════════════════════
    //  Review Moderation (Doc §10)
    // ═══════════════════════════════════════════════════════════════

    /**
     * List reviews with filters (status, doctor_id, search).
     */
    public function listReviews(array $filters): LengthAwarePaginator
    {
        return DoctorReview::query()
            ->with([
                'doctor:id,fullname,email,avatar',
                'patient:id,fullname,email,avatar',
                'moderator:id,fullname',
            ])
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('moderation_status', $v))
            ->when($filters['doctor_id'] ?? null, fn($q, $v) => $q->where('doctor_id', $v))
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->whereHas('patient', fn($pq) => $pq->where('fullname', 'ilike', "%{$s}%"))
                  ->orWhereHas('doctor', fn($dq) => $dq->where('fullname', 'ilike', "%{$s}%"));
            })
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Approve a review — makes it visible.
     */
    public function approveReview(string $reviewId, string $moderatorId): DoctorReview
    {
        $review = DoctorReview::findOrFail($reviewId);

        $review->update([
            'moderation_status' => 'approved',
            'is_visible'        => true,
            'moderated_by'      => $moderatorId,
            'moderated_at'      => now(),
        ]);

        DoctorReview::recalculateAggregatedRating($review->doctor_id);

        $this->logAudit(
            userId: $moderatorId,
            action: 'review_approved',
            resourceType: 'doctor_review',
            resourceId: $review->id,
            description: "Approved review by {$review->patient->fullname} for {$review->doctor->fullname}",
        );

        $result = $review->refresh()->load(['doctor:id,fullname,avatar', 'patient:id,fullname,avatar', 'moderator:id,fullname']);

        // Notify the doctor
        $doctor = User::find($review->doctor_id);
        if ($doctor) {
            $doctor->notify(new ReviewModerationNotification($review, 'approved'));
        }

        return $result;
    }

    /**
     * Reject a review (misleading content) — hides it permanently.
     */
    public function rejectReview(string $reviewId, string $moderatorId, ?string $note = null): DoctorReview
    {
        $review = DoctorReview::findOrFail($reviewId);

        $review->update([
            'moderation_status' => 'rejected',
            'is_visible'        => false,
            'moderated_by'      => $moderatorId,
            'moderated_at'      => now(),
            'moderation_note'   => $note,
        ]);

        DoctorReview::recalculateAggregatedRating($review->doctor_id);

        $this->logAudit(
            userId: $moderatorId,
            action: 'review_rejected',
            resourceType: 'doctor_review',
            resourceId: $review->id,
            newValues: ['note' => $note],
            description: "Rejected review by {$review->patient->fullname} for {$review->doctor->fullname}",
        );

        $result = $review->refresh()->load(['doctor:id,fullname,avatar', 'patient:id,fullname,avatar', 'moderator:id,fullname']);

        // Notify the doctor
        $doctor = User::find($review->doctor_id);
        if ($doctor) {
            $doctor->notify(new ReviewModerationNotification($review, 'rejected'));
        }

        return $result;
    }

    /**
     * Hide a review temporarily (soft hide without rejecting).
     */
    public function hideReview(string $reviewId, string $moderatorId, ?string $note = null): DoctorReview
    {
        $review = DoctorReview::findOrFail($reviewId);

        $review->update([
            'moderation_status' => 'hidden',
            'is_visible'        => false,
            'moderated_by'      => $moderatorId,
            'moderated_at'      => now(),
            'moderation_note'   => $note,
        ]);

        DoctorReview::recalculateAggregatedRating($review->doctor_id);

        $this->logAudit(
            userId: $moderatorId,
            action: 'review_hidden',
            resourceType: 'doctor_review',
            resourceId: $review->id,
            description: "Hidden review by {$review->patient->fullname} for {$review->doctor->fullname}",
        );

        $result = $review->refresh()->load(['doctor:id,fullname,avatar', 'patient:id,fullname,avatar', 'moderator:id,fullname']);

        // Notify the doctor
        $doctor = User::find($review->doctor_id);
        if ($doctor) {
            $doctor->notify(new ReviewModerationNotification($review, 'hidden'));
        }

        return $result;
    }

    /**
     * Get review moderation statistics.
     */
    public function getReviewStats(): array
    {
        return [
            'pending'  => DoctorReview::pending()->count(),
            'approved' => DoctorReview::approved()->count(),
            'rejected' => DoctorReview::rejected()->count(),
            'hidden'   => DoctorReview::hidden()->count(),
        ];
    }
}
