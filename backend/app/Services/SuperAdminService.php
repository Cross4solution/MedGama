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
        $oldValue = (bool) $doctor->is_verified;
        $doctor->is_verified = $verified;
        $doctor->save();

        // Audit log
        AuditLog::log(
            action: $verified ? 'doctor.verified' : 'doctor.unverified',
            resourceType: 'User',
            resourceId: $doctor->id,
            oldValues: ['is_verified' => $oldValue],
            newValues: ['is_verified' => $verified],
            description: ($verified ? 'Verified' : 'Unverified') . " doctor: {$doctor->fullname}",
        );

        // Send notification to doctor
        if ($verified && !$oldValue) {
            $doctor->notify(new \App\Notifications\VerificationApprovedNotification(
                $doctor->verificationRequests()->latest()->first()
            ));
        }

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

        AuditLog::log(
            action: 'report.dismissed',
            resourceType: 'MedStreamReport',
            resourceId: $report->id,
            newValues: ['admin_status' => 'reviewed', 'post_id' => $report->post_id],
            description: "Dismissed content report #{$report->id}",
        );

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

        AuditLog::log(
            action: 'report.content_removed',
            resourceType: 'MedStreamReport',
            resourceId: $report->id,
            newValues: ['admin_status' => 'hidden', 'post_id' => $report->post_id],
            description: "Removed reported content — post hidden for report #{$report->id}",
        );

        return $report->refresh();
    }

    /**
     * Suspend or reactivate a user.
     */
    public function suspendUser(string $userId, bool $suspend): User
    {
        $user = User::findOrFail($userId);
        $oldActive = (bool) $user->is_active;
        $user->is_active = !$suspend;
        $user->save();

        AuditLog::log(
            action: $suspend ? 'user.suspended' : 'user.reactivated',
            resourceType: 'User',
            resourceId: $user->id,
            oldValues: ['is_active' => $oldActive],
            newValues: ['is_active' => !$suspend],
            description: ($suspend ? 'Suspended' : 'Reactivated') . " user: {$user->fullname}",
        );

        Cache::forget('superadmin:dashboard');

        return $user;
    }

    // ══════════════════════════════════════════════
    //  USER MANAGEMENT (Doc §14)
    // ══════════════════════════════════════════════

    /**
     * List all users with filters: role, search, status, pagination.
     */
    public function listUsers(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->with('clinic:id,fullname')
            ->when($filters['role'] ?? null, fn($q, $v) => $q->where('role_id', $v))
            ->when(isset($filters['is_active']), fn($q) => $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)))
            ->when(isset($filters['is_verified']), fn($q) => $q->where('is_verified', filter_var($filters['is_verified'], FILTER_VALIDATE_BOOLEAN)))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('fullname', 'ilike', "%{$search}%")
                       ->orWhere('email', 'ilike', "%{$search}%")
                       ->orWhere('mobile', 'ilike', "%{$search}%");
                });
            })
            ->select('id', 'fullname', 'email', 'avatar', 'role_id', 'mobile', 'is_verified', 'is_active', 'clinic_id', 'created_at', 'last_login')
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 25);
    }

    /**
     * Update user role.
     */
    public function updateUserRole(string $userId, string $newRole, string $adminId): User
    {
        $user = User::findOrFail($userId);
        $oldRole = $user->role_id;

        $user->update(['role_id' => $newRole]);

        AuditLog::log(
            action: 'user.role_changed',
            resourceType: 'User',
            resourceId: $user->id,
            oldValues: ['role_id' => $oldRole],
            newValues: ['role_id' => $newRole],
            description: "Role changed for {$user->fullname}: {$oldRole} → {$newRole}",
        );

        Cache::forget('superadmin:dashboard');

        return $user->refresh();
    }

    /**
     * User management stats.
     */
    public function getUserStats(): array
    {
        return Cache::remember('superadmin:user-stats', 300, function () {
            $counts = User::query()
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN role_id = 'doctor' THEN 1 ELSE 0 END) as doctors,
                    SUM(CASE WHEN role_id = 'patient' THEN 1 ELSE 0 END) as patients,
                    SUM(CASE WHEN role_id = 'clinicOwner' THEN 1 ELSE 0 END) as clinic_owners,
                    SUM(CASE WHEN role_id = 'superAdmin' THEN 1 ELSE 0 END) as admins,
                    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as suspended,
                    SUM(CASE WHEN role_id = 'doctor' AND is_verified = false THEN 1 ELSE 0 END) as unverified_doctors
                ")
                ->first();

            return [
                'total'              => (int) $counts->total,
                'doctors'            => (int) $counts->doctors,
                'patients'           => (int) $counts->patients,
                'clinic_owners'      => (int) $counts->clinic_owners,
                'admins'             => (int) $counts->admins,
                'suspended'          => (int) $counts->suspended,
                'unverified_doctors' => (int) $counts->unverified_doctors,
            ];
        });
    }

    // ══════════════════════════════════════════════
    //  USER 360 VIEW
    // ══════════════════════════════════════════════

    /**
     * Full user detail for admin User 360 view.
     * Returns profile, recent appointments, verification docs, audit trail, counts.
     */
    public function getUserDetail(string $userId): array
    {
        $user = User::with(['clinic:id,fullname,address,phone'])
            ->findOrFail($userId);

        // Recent appointments (last 10)
        $appointments = Appointment::where('doctor_id', $user->id)
            ->orWhere('patient_id', $user->id)
            ->with(['doctor:id,fullname,avatar', 'patient:id,fullname,avatar'])
            ->orderByDesc('appointment_date')
            ->limit(10)
            ->get(['id', 'doctor_id', 'patient_id', 'appointment_date', 'start_time', 'end_time', 'status', 'appointment_type']);

        // Verification documents (doctors only)
        $verificationDocs = [];
        if ($user->role_id === 'doctor') {
            $verificationDocs = VerificationRequest::where('doctor_id', $user->id)
                ->with('reviewer:id,fullname')
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(['id', 'document_type', 'file_name', 'document_label', 'status', 'rejection_reason', 'reviewed_by', 'reviewed_at', 'created_at']);
        }

        // Recent audit logs (last 15)
        $auditLogs = AuditLog::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(15)
            ->get(['id', 'action', 'resource_type', 'resource_id', 'description', 'ip_address', 'created_at']);

        // Activity counts
        $counts = [
            'appointments' => Appointment::where('doctor_id', $user->id)->orWhere('patient_id', $user->id)->count(),
            'posts'        => MedStreamPost::where('author_id', $user->id)->count(),
            'reviews'      => DB::table('doctor_reviews')->where('doctor_id', $user->id)->orWhere('patient_id', $user->id)->count(),
            'audit_logs'   => AuditLog::where('user_id', $user->id)->count(),
        ];

        return [
            'user'              => $user,
            'appointments'      => $appointments,
            'verification_docs' => $verificationDocs,
            'audit_logs'        => $auditLogs,
            'counts'            => $counts,
        ];
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
            // Branding & Meta
            ['key' => 'branding.site_title',       'value' => 'MedaGama',                                 'type' => 'string',  'group' => 'branding', 'label' => 'Site Title',        'description' => 'Main site title displayed in browser tab and header'],
            ['key' => 'branding.site_description',  'value' => 'Modern healthcare platform for patients and doctors', 'type' => 'string',  'group' => 'branding', 'label' => 'Meta Description',  'description' => 'Default meta description for SEO'],
            ['key' => 'branding.site_logo_url',     'value' => '/images/logo.svg',                         'type' => 'string',  'group' => 'branding', 'label' => 'Logo URL',           'description' => 'Path or URL for the site logo'],
            ['key' => 'branding.primary_color',     'value' => '#0D9488',                                  'type' => 'string',  'group' => 'branding', 'label' => 'Primary Color',      'description' => 'Primary brand color (hex)'],
            ['key' => 'branding.support_email',     'value' => 'support@medgama.com',                      'type' => 'string',  'group' => 'branding', 'label' => 'Support Email',      'description' => 'Public support contact email'],
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

    /**
     * Audit log summary stats.
     */
    public function auditLogStats(): array
    {
        $total = AuditLog::count();
        $today = AuditLog::whereDate('created_at', today())->count();
        $thisWeek = AuditLog::where('created_at', '>=', now()->startOfWeek())->count();

        $topActions = AuditLog::selectRaw("action, count(*) as count")
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(5)
            ->pluck('count', 'action');

        $topResourceTypes = AuditLog::selectRaw("resource_type, count(*) as count")
            ->groupBy('resource_type')
            ->orderByDesc('count')
            ->limit(5)
            ->pluck('count', 'resource_type');

        return [
            'total'             => $total,
            'today'             => $today,
            'this_week'         => $thisWeek,
            'top_actions'       => $topActions,
            'top_resource_types' => $topResourceTypes,
        ];
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
     * Get full doctor verification detail: profile + all verification requests.
     */
    public function getDoctorVerificationDetail(string $doctorId): array
    {
        $doctor = User::with([
            'doctorProfile:id,user_id,specialty,title,bio,experience_years,languages,education',
            'clinic:id,fullname',
        ])->findOrFail($doctorId);

        $requests = VerificationRequest::where('doctor_id', $doctorId)
            ->with('reviewer:id,fullname')
            ->orderByDesc('created_at')
            ->get();

        return [
            'doctor' => [
                'id'           => $doctor->id,
                'fullname'     => $doctor->fullname,
                'email'        => $doctor->email,
                'avatar'       => $doctor->avatar,
                'mobile'       => $doctor->mobile,
                'role_id'      => $doctor->role_id,
                'is_verified'  => $doctor->is_verified,
                'is_active'    => $doctor->is_active,
                'created_at'   => $doctor->created_at?->toISOString(),
                'clinic'       => $doctor->clinic ? ['id' => $doctor->clinic->id, 'fullname' => $doctor->clinic->fullname] : null,
                'profile'      => $doctor->doctorProfile ? [
                    'specialty'        => $doctor->doctorProfile->specialty,
                    'title'            => $doctor->doctorProfile->title,
                    'bio'              => $doctor->doctorProfile->bio,
                    'experience_years' => $doctor->doctorProfile->experience_years,
                    'languages'        => $doctor->doctorProfile->languages,
                    'education'        => $doctor->doctorProfile->education,
                ] : null,
            ],
            'verification_requests' => $requests->map(fn($vr) => [
                'id'               => $vr->id,
                'document_type'    => $vr->document_type,
                'document_label'   => $vr->document_label,
                'file_name'        => $vr->file_name,
                'mime_type'        => $vr->mime_type,
                'status'           => $vr->status,
                'notes'            => $vr->notes,
                'rejection_reason' => $vr->rejection_reason,
                'reviewer'         => $vr->reviewer ? ['id' => $vr->reviewer->id, 'fullname' => $vr->reviewer->fullname] : null,
                'reviewed_at'      => $vr->reviewed_at?->toISOString(),
                'created_at'       => $vr->created_at?->toISOString(),
            ])->toArray(),
            'stats' => [
                'total'    => $requests->count(),
                'pending'  => $requests->where('status', 'pending')->count(),
                'approved' => $requests->where('status', 'approved')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ],
        ];
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

    // ══════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ══════════════════════════════════════════════

    /**
     * Convenience wrapper around AuditLog::log with explicit userId.
     */
    private function logAudit(
        string $userId,
        string $action,
        string $resourceType,
        ?string $resourceId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
    ): void {
        AuditLog::create([
            'user_id'       => $userId,
            'action'        => $action,
            'resource_type' => $resourceType,
            'resource_id'   => $resourceId,
            'old_values'    => $oldValues,
            'new_values'    => $newValues,
            'ip_address'    => request()?->ip(),
            'user_agent'    => request()?->userAgent(),
            'description'   => $description,
            'created_at'    => now(),
        ]);
    }
}
