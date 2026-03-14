<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\MedStreamPost;
use App\Models\MedStreamReport;
use App\Models\User;
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
}
