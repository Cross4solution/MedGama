<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\MedStreamEngagementCounter;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ClinicAnalyticsService
{
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Get clinic summary for the current month.
     *
     * Returns: total appointments, cancellation rate, new patients, MedStream engagement.
     */
    public function getClinicSummary(string $clinicId): array
    {
        $cacheKey = "clinic_summary:{$clinicId}:" . now()->format('Y-m');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($clinicId) {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth   = Carbon::now()->endOfMonth();

            // ── Appointment Stats ──
            $appointmentStats = Appointment::where('clinic_id', $clinicId)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw("
                    COUNT(*) as total_appointments,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
                ")
                ->first();

            $total     = (int) $appointmentStats->total_appointments;
            $cancelled = (int) $appointmentStats->cancelled_count;

            // ── New Patients (first appointment at this clinic this month) ──
            $newPatients = Appointment::where('clinic_id', $clinicId)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->whereNotExists(function ($query) use ($clinicId, $startOfMonth) {
                    $query->select(DB::raw(1))
                        ->from('appointments as prev')
                        ->whereColumn('prev.patient_id', 'appointments.patient_id')
                        ->where('prev.clinic_id', $clinicId)
                        ->where('prev.created_at', '<', $startOfMonth);
                })
                ->distinct('patient_id')
                ->count('patient_id');

            // ── MedStream Engagement (posts by clinic doctors this month) ──
            $doctorIds = User::where('clinic_id', $clinicId)
                ->where('role_id', 'doctor')
                ->where('is_active', true)
                ->pluck('id');

            $engagement = ['total_likes' => 0, 'total_comments' => 0, 'total_posts' => 0];

            if ($doctorIds->isNotEmpty()) {
                $postIds = MedStreamPost::withoutGlobalScopes()
                    ->whereIn('author_id', $doctorIds)
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->where('is_active', true)
                    ->pluck('id');

                $engagement['total_posts'] = $postIds->count();

                if ($postIds->isNotEmpty()) {
                    $counters = MedStreamEngagementCounter::whereIn('post_id', $postIds)
                        ->selectRaw('COALESCE(SUM(like_count), 0) as likes, COALESCE(SUM(comment_count), 0) as comments')
                        ->first();

                    $engagement['total_likes']    = (int) $counters->likes;
                    $engagement['total_comments'] = (int) $counters->comments;
                }
            }

            return [
                'period'       => now()->format('Y-m'),
                'appointments' => [
                    'total'             => $total,
                    'completed'         => (int) $appointmentStats->completed_count,
                    'confirmed'         => (int) $appointmentStats->confirmed_count,
                    'pending'           => (int) $appointmentStats->pending_count,
                    'cancelled'         => $cancelled,
                    'cancellation_rate' => $total > 0
                        ? round(($cancelled / $total) * 100, 1)
                        : 0.0,
                ],
                'new_patients' => $newPatients,
                'engagement'   => $engagement,
            ];
        });
    }

    /**
     * Get MedStream engagement stats with daily trend (Chart.js / Recharts compatible).
     *
     * Returns: totals + daily labels[] and datasets[] for charting.
     */
    public function getEngagementStats(string $clinicId): array
    {
        $cacheKey = "clinic_engagement:{$clinicId}:" . now()->format('Y-m');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($clinicId) {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth   = Carbon::now()->endOfMonth();

            $doctorIds = User::where('clinic_id', $clinicId)
                ->where('role_id', 'doctor')
                ->where('is_active', true)
                ->pluck('id');

            if ($doctorIds->isEmpty()) {
                return $this->emptyEngagementResponse($startOfMonth, $endOfMonth);
            }

            // ── Totals ──
            $postIds = MedStreamPost::withoutGlobalScopes()
                ->whereIn('author_id', $doctorIds)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->where('is_active', true)
                ->pluck('id');

            $totals = ['posts' => $postIds->count(), 'likes' => 0, 'comments' => 0];

            if ($postIds->isNotEmpty()) {
                $agg = MedStreamEngagementCounter::whereIn('post_id', $postIds)
                    ->selectRaw('COALESCE(SUM(like_count), 0) as likes, COALESCE(SUM(comment_count), 0) as comments')
                    ->first();
                $totals['likes']    = (int) $agg->likes;
                $totals['comments'] = (int) $agg->comments;
            }

            // ── Daily Trend (Chart.js format: labels + datasets) ──
            $dailyPosts = MedStreamPost::withoutGlobalScopes()
                ->whereIn('author_id', $doctorIds)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->where('is_active', true)
                ->selectRaw("DATE(created_at) as day, COUNT(*) as count")
                ->groupBy('day')
                ->pluck('count', 'day');

            $labels   = [];
            $postData = [];
            $period   = Carbon::parse($startOfMonth);
            $end      = Carbon::parse($endOfMonth)->min(Carbon::now());

            while ($period->lte($end)) {
                $dayStr     = $period->toDateString();
                $labels[]   = $period->format('M d');
                $postData[] = (int) ($dailyPosts[$dayStr] ?? 0);
                $period->addDay();
            }

            return [
                'period' => now()->format('Y-m'),
                'totals' => $totals,
                'chart'  => [
                    'labels'   => $labels,
                    'datasets' => [
                        [
                            'label'           => 'Posts',
                            'data'            => $postData,
                            'backgroundColor' => 'rgba(59, 130, 246, 0.5)',
                            'borderColor'     => 'rgb(59, 130, 246)',
                        ],
                    ],
                ],
            ];
        });
    }

    /**
     * Get daily appointment trend for charting (Chart.js / Recharts compatible).
     */
    public function getAppointmentTrend(string $clinicId): array
    {
        $cacheKey = "clinic_appt_trend:{$clinicId}:" . now()->format('Y-m');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($clinicId) {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth   = Carbon::now()->endOfMonth();

            $daily = Appointment::where('clinic_id', $clinicId)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw("
                    DATE(created_at) as day,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                ")
                ->groupBy('day')
                ->get()
                ->keyBy('day');

            $labels    = [];
            $totalData = [];
            $compData  = [];
            $cancData  = [];
            $period    = Carbon::parse($startOfMonth);
            $end       = Carbon::parse($endOfMonth)->min(Carbon::now());

            while ($period->lte($end)) {
                $dayStr      = $period->toDateString();
                $labels[]    = $period->format('M d');
                $row         = $daily[$dayStr] ?? null;
                $totalData[] = (int) ($row?->total ?? 0);
                $compData[]  = (int) ($row?->completed ?? 0);
                $cancData[]  = (int) ($row?->cancelled ?? 0);
                $period->addDay();
            }

            return [
                'period' => now()->format('Y-m'),
                'chart'  => [
                    'labels'   => $labels,
                    'datasets' => [
                        [
                            'label'           => 'Total',
                            'data'            => $totalData,
                            'backgroundColor' => 'rgba(59, 130, 246, 0.5)',
                            'borderColor'     => 'rgb(59, 130, 246)',
                        ],
                        [
                            'label'           => 'Completed',
                            'data'            => $compData,
                            'backgroundColor' => 'rgba(34, 197, 94, 0.5)',
                            'borderColor'     => 'rgb(34, 197, 94)',
                        ],
                        [
                            'label'           => 'Cancelled',
                            'data'            => $cancData,
                            'backgroundColor' => 'rgba(239, 68, 68, 0.5)',
                            'borderColor'     => 'rgb(239, 68, 68)',
                        ],
                    ],
                ],
            ];
        });
    }

    /**
     * Empty engagement response when clinic has no doctors.
     */
    private function emptyEngagementResponse(Carbon $start, Carbon $end): array
    {
        $labels   = [];
        $postData = [];
        $period   = Carbon::parse($start);
        $endDate  = Carbon::parse($end)->min(Carbon::now());

        while ($period->lte($endDate)) {
            $labels[]   = $period->format('M d');
            $postData[] = 0;
            $period->addDay();
        }

        return [
            'period' => now()->format('Y-m'),
            'totals' => ['posts' => 0, 'likes' => 0, 'comments' => 0],
            'chart'  => [
                'labels'   => $labels,
                'datasets' => [
                    ['label' => 'Posts', 'data' => $postData, 'backgroundColor' => 'rgba(59, 130, 246, 0.5)', 'borderColor' => 'rgb(59, 130, 246)'],
                ],
            ],
        ];
    }

    /**
     * Get performance metrics for each doctor in the clinic.
     *
     * Returns: per-doctor completed appointments and profile view count.
     */
    public function getDoctorPerformance(string $clinicId): array
    {
        $cacheKey = "doctor_performance:{$clinicId}:" . now()->format('Y-m');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($clinicId) {
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth   = Carbon::now()->endOfMonth();

            $doctors = User::where('clinic_id', $clinicId)
                ->where('role_id', 'doctor')
                ->where('is_active', true)
                ->select('id', 'fullname', 'avatar')
                ->get();

            $doctorIds = $doctors->pluck('id');

            // ── Appointment counts per doctor ──
            $appointmentCounts = Appointment::where('clinic_id', $clinicId)
                ->whereIn('doctor_id', $doctorIds)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw("
                    doctor_id,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                ")
                ->groupBy('doctor_id')
                ->get()
                ->keyBy('doctor_id');

            // ── MedStream post counts per doctor ──
            $postCounts = MedStreamPost::withoutGlobalScopes()
                ->whereIn('author_id', $doctorIds)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->where('is_active', true)
                ->selectRaw('author_id, COUNT(*) as post_count')
                ->groupBy('author_id')
                ->pluck('post_count', 'author_id');

            // ── Profile view counts from audit logs (if available) ──
            $profileViews = [];
            if (\Schema::hasTable('health_data_audit_logs')) {
                $profileViews = DB::table('health_data_audit_logs')
                    ->whereIn('resource_id', $doctorIds)
                    ->where('resource_type', 'doctor_profile')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->selectRaw('resource_id, COUNT(*) as view_count')
                    ->groupBy('resource_id')
                    ->pluck('view_count', 'resource_id')
                    ->toArray();
            }

            return $doctors->map(function ($doctor) use ($appointmentCounts, $postCounts, $profileViews) {
                $stats = $appointmentCounts[$doctor->id] ?? null;

                return [
                    'doctor_id'      => $doctor->id,
                    'fullname'       => $doctor->fullname,
                    'avatar'         => $doctor->avatar,
                    'appointments'   => [
                        'total'     => (int) ($stats?->total ?? 0),
                        'completed' => (int) ($stats?->completed ?? 0),
                        'cancelled' => (int) ($stats?->cancelled ?? 0),
                    ],
                    'posts_count'    => (int) ($postCounts[$doctor->id] ?? 0),
                    'profile_views'  => (int) ($profileViews[$doctor->id] ?? 0),
                ];
            })->values()->toArray();
        });
    }
}
