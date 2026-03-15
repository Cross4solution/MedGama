<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceService
{
    private const PLATFORM_COMMISSION_RATE = 0.15; // 15% platform commission

    private const CURRENCY_RATES = [
        'EUR' => 1.0,
        'USD' => 1.08,
        'TRY' => 34.50,
        'GBP' => 0.86,
    ];

    // ══════════════════════════════════════════════
    //  TOP SERVICES (revenue by category)
    // ══════════════════════════════════════════════

    /**
     * Top revenue-generating service categories for a doctor/clinic.
     */
    public function topServices(User $user, ?string $currency = null, int $limit = 10): array
    {
        $query = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.status', 'paid')
            ->whereNull('invoices.deleted_at');

        $this->scopeInvoiceJoin($query, $user);

        if ($currency) {
            $query->where('invoices.currency', $currency);
        }

        $rows = $query
            ->select(
                'invoice_items.category',
                DB::raw('COUNT(DISTINCT invoice_items.invoice_id) as invoice_count'),
                DB::raw('SUM(invoice_items.quantity) as total_quantity'),
                DB::raw('SUM(invoice_items.total_price) as total_revenue'),
            )
            ->groupBy('invoice_items.category')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get();

        $grandTotal = $rows->sum('total_revenue');

        return $rows->map(function ($row) use ($grandTotal) {
            $percent = $grandTotal > 0 ? round(($row->total_revenue / $grandTotal) * 100, 1) : 0;
            return [
                'category'       => $row->category ?: 'Uncategorized',
                'invoice_count'  => (int) $row->invoice_count,
                'total_quantity' => (int) $row->total_quantity,
                'total_revenue'  => round((float) $row->total_revenue, 2),
                'percent'        => $percent,
            ];
        })->values()->toArray();
    }

    // ══════════════════════════════════════════════
    //  PAYOUT / COMMISSION (Doctor Hakediş)
    // ══════════════════════════════════════════════

    /**
     * Payout summary for a doctor: gross, commission, net.
     */
    public function payoutSummary(User $user, ?string $currency = null, ?string $periodStart = null, ?string $periodEnd = null): array
    {
        $query = Invoice::query()->where('status', 'paid');
        $this->scopeQuery($query, $user);

        if ($currency) {
            $query->where('currency', $currency);
        }
        if ($periodStart) {
            $query->whereDate('paid_at', '>=', $periodStart);
        }
        if ($periodEnd) {
            $query->whereDate('paid_at', '<=', $periodEnd);
        }

        $grossRevenue   = (float) (clone $query)->sum('grand_total');
        $commissionRate = self::PLATFORM_COMMISSION_RATE;
        $commission     = round($grossRevenue * $commissionRate, 2);
        $netPayout      = round($grossRevenue - $commission, 2);

        // Monthly breakdown
        $monthly = (clone $query)
            ->select(
                DB::raw("TO_CHAR(paid_at, 'YYYY-MM') as period"),
                DB::raw('SUM(grand_total) as gross'),
                DB::raw('COUNT(*) as invoice_count')
            )
            ->groupBy(DB::raw("TO_CHAR(paid_at, 'YYYY-MM')"))
            ->orderBy('period')
            ->get()
            ->map(function ($row) use ($commissionRate) {
                $gross = round((float) $row->gross, 2);
                return [
                    'period'        => $row->period,
                    'gross'         => $gross,
                    'commission'    => round($gross * $commissionRate, 2),
                    'net'           => round($gross * (1 - $commissionRate), 2),
                    'invoice_count' => (int) $row->invoice_count,
                ];
            });

        return [
            'gross_revenue'   => round($grossRevenue, 2),
            'commission_rate' => $commissionRate,
            'commission'      => $commission,
            'net_payout'      => $netPayout,
            'currency'        => $currency ?? 'EUR',
            'period_start'    => $periodStart,
            'period_end'      => $periodEnd,
            'monthly'         => $monthly->values()->toArray(),
        ];
    }

    // ══════════════════════════════════════════════
    //  PLATFORM OVERVIEW (SuperAdmin)
    // ══════════════════════════════════════════════

    /**
     * Platform-wide financial overview — only for superAdmin/saasAdmin.
     */
    public function platformOverview(?string $currency = null): array
    {
        $activeCurrency = $currency ?? 'EUR';

        $baseQuery = Invoice::query()->whereNull('deleted_at');
        $paidQuery = (clone $baseQuery)->where('status', 'paid');

        if ($currency) {
            $baseQuery->where('currency', $currency);
            $paidQuery->where('currency', $currency);
        }

        $totalInvoices     = (clone $baseQuery)->count();
        $totalGrossRevenue = (float) (clone $paidQuery)->sum('grand_total');
        $totalCommission   = round($totalGrossRevenue * self::PLATFORM_COMMISSION_RATE, 2);
        $totalNetPayout    = round($totalGrossRevenue - $totalCommission, 2);

        $pendingPayments = (clone $baseQuery)
            ->whereIn('status', ['pending', 'partial'])
            ->select(
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(grand_total - paid_amount) as total_pending')
            )
            ->first();

        // Monthly platform revenue (last 12 months)
        $monthStart = Carbon::now()->subMonths(11)->startOfMonth();
        $monthlyRevenue = (clone $paidQuery)
            ->where('paid_at', '>=', $monthStart)
            ->select(
                DB::raw("TO_CHAR(paid_at, 'YYYY-MM') as period"),
                DB::raw('SUM(grand_total) as gross')
            )
            ->groupBy(DB::raw("TO_CHAR(paid_at, 'YYYY-MM')"))
            ->orderBy('period')
            ->get()
            ->map(function ($row) {
                $gross = round((float) $row->gross, 2);
                return [
                    'period'     => $row->period,
                    'gross'      => $gross,
                    'commission' => round($gross * self::PLATFORM_COMMISSION_RATE, 2),
                    'net'        => round($gross * (1 - self::PLATFORM_COMMISSION_RATE), 2),
                ];
            });

        // Top doctors by revenue
        $topDoctors = Invoice::query()
            ->where('status', 'paid')
            ->whereNull('deleted_at')
            ->when($currency, fn($q, $c) => $q->where('currency', $c))
            ->join('users', 'invoices.doctor_id', '=', 'users.id')
            ->select(
                'invoices.doctor_id',
                'users.fullname',
                'users.avatar',
                DB::raw('SUM(invoices.grand_total) as total_revenue'),
                DB::raw('COUNT(*) as invoice_count'),
            )
            ->groupBy('invoices.doctor_id', 'users.fullname', 'users.avatar')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'doctor_id'     => $r->doctor_id,
                'fullname'      => $r->fullname,
                'avatar'        => $r->avatar,
                'total_revenue' => round((float) $r->total_revenue, 2),
                'commission'    => round((float) $r->total_revenue * self::PLATFORM_COMMISSION_RATE, 2),
                'invoice_count' => (int) $r->invoice_count,
            ]);

        // Available currencies
        $currencies = Invoice::query()->whereNull('deleted_at')->distinct()->pluck('currency')->sort()->values()->toArray();

        return [
            'currency'              => $activeCurrency,
            'available_currencies'  => $currencies,
            'total_invoices'        => $totalInvoices,
            'total_gross_revenue'   => round($totalGrossRevenue, 2),
            'total_commission'      => $totalCommission,
            'total_net_payout'      => $totalNetPayout,
            'commission_rate'       => self::PLATFORM_COMMISSION_RATE,
            'pending_count'         => (int) ($pendingPayments->count ?? 0),
            'pending_amount'        => round((float) ($pendingPayments->total_pending ?? 0), 2),
            'monthly_revenue'       => $monthlyRevenue->values()->toArray(),
            'top_doctors'           => $topDoctors->values()->toArray(),
        ];
    }

    // ══════════════════════════════════════════════
    //  MULTI-CURRENCY CONVERSION (Simulation)
    // ══════════════════════════════════════════════

    /**
     * Convert amount between currencies using simulated rates.
     */
    public function convertCurrency(float $amount, string $from, string $to): array
    {
        $fromRate = self::CURRENCY_RATES[$from] ?? 1.0;
        $toRate   = self::CURRENCY_RATES[$to] ?? 1.0;
        $inEur    = $amount / $fromRate;
        $converted = round($inEur * $toRate, 2);

        return [
            'original_amount'   => $amount,
            'original_currency' => $from,
            'converted_amount'  => $converted,
            'target_currency'   => $to,
            'rate'              => round($toRate / $fromRate, 6),
            'rate_date'         => now()->toDateString(),
            'note'              => 'Simulated exchange rate',
        ];
    }

    /**
     * Get all available exchange rates.
     */
    public function getExchangeRates(): array
    {
        return [
            'base'  => 'EUR',
            'date'  => now()->toDateString(),
            'rates' => self::CURRENCY_RATES,
            'note'  => 'Simulated exchange rates for development',
        ];
    }

    // ══════════════════════════════════════════════
    //  EXPORT (CSV for XLSX-compatible download)
    // ══════════════════════════════════════════════

    /**
     * Export invoices as CSV (Excel-compatible).
     */
    public function exportCsv(User $user, array $filters = []): string
    {
        $query = Invoice::query()
            ->with(['patient:id,fullname,email', 'doctor:id,fullname', 'items']);

        $this->scopeQuery($query, $user);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['currency'])) {
            $query->where('currency', $filters['currency']);
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('issue_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('issue_date', '<=', $filters['date_to']);
        }

        $invoices = $query->orderByDesc('issue_date')->get();

        $lines = [];
        $lines[] = implode(',', [
            'Invoice #', 'Patient', 'Doctor', 'Issue Date', 'Due Date',
            'Currency', 'Subtotal', 'Tax Rate', 'Tax Amount', 'Discount',
            'Grand Total', 'Paid Amount', 'Remaining', 'Status', 'Payment Method',
            'Services',
        ]);

        foreach ($invoices as $inv) {
            $services = $inv->items->pluck('description')->implode(' | ');
            $lines[] = implode(',', [
                $this->csvEscape($inv->invoice_number),
                $this->csvEscape($inv->patient?->fullname ?? ''),
                $this->csvEscape($inv->doctor?->fullname ?? ''),
                $inv->issue_date?->format('Y-m-d') ?? '',
                $inv->due_date?->format('Y-m-d') ?? '',
                $inv->currency,
                $inv->subtotal,
                $inv->tax_rate,
                $inv->tax_amount,
                $inv->discount_amount,
                $inv->grand_total,
                $inv->paid_amount,
                $inv->remainingAmount(),
                $inv->status,
                $this->csvEscape($inv->payment_method ?? ''),
                $this->csvEscape($services),
            ]);
        }

        return implode("\n", $lines);
    }

    // ══════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════

    private function scopeQuery($query, User $user): void
    {
        $role = $user->role_id;

        if (in_array($role, ['superAdmin', 'saasAdmin'])) {
            return;
        }

        if ($role === 'clinicOwner') {
            $clinicId = $user->ownedClinic?->id ?? $user->clinic_id;
            if ($clinicId) {
                $query->where('clinic_id', $clinicId);
            } else {
                $query->where('doctor_id', $user->id);
            }
        } elseif ($role === 'hospital') {
            $clinicIds = \App\Models\Clinic::where('hospital_id', $user->hospital_id)->pluck('id');
            $query->whereIn('clinic_id', $clinicIds);
        } else {
            $query->where('doctor_id', $user->id);
        }
    }

    private function scopeInvoiceJoin($query, User $user): void
    {
        $role = $user->role_id;
        if (in_array($role, ['superAdmin', 'saasAdmin'])) return;

        if ($role === 'clinicOwner') {
            $clinicId = $user->ownedClinic?->id ?? $user->clinic_id;
            $query->where('invoices.clinic_id', $clinicId ?: $user->id);
        } else {
            $query->where('invoices.doctor_id', $user->id);
        }
    }

    private function csvEscape(string $value): string
    {
        if (str_contains($value, ',') || str_contains($value, '"') || str_contains($value, "\n")) {
            return '"' . str_replace('"', '""', $value) . '"';
        }
        return $value;
    }
}
