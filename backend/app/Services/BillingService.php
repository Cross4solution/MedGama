<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BillingService
{
    // ══════════════════════════════════════════════
    //  INVOICE CRUD
    // ══════════════════════════════════════════════

    /**
     * List invoices with filters and pagination.
     */
    public function listInvoices(User $user, array $filters): LengthAwarePaginator
    {
        $query = Invoice::query()
            ->with(['patient:id,fullname,email,mobile,avatar', 'doctor:id,fullname', 'items']);

        // Scope by clinic or doctor
        $this->scopeQuery($query, $user);

        // Filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'ilike', "%{$search}%")
                  ->orWhereHas('patient', fn($pq) => $pq->where('fullname', 'ilike', "%{$search}%"));
            });
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('issue_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('issue_date', '<=', $filters['date_to']);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $allowed = ['created_at', 'issue_date', 'grand_total', 'invoice_number', 'status'];
        if (!in_array($sortBy, $allowed)) $sortBy = 'created_at';

        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        return $query->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Create a new invoice with line items.
     */
    public function createInvoice(User $user, array $data): Invoice
    {
        return DB::transaction(function () use ($user, $data) {
            $clinicId = $this->resolveClinicId($user);

            // Create invoice
            $invoice = Invoice::create([
                'invoice_number'  => Invoice::generateInvoiceNumber(),
                'patient_id'      => $data['patient_id'],
                'clinic_id'       => $clinicId,
                'doctor_id'       => $this->resolveDoctorId($user),
                'appointment_id'  => $data['appointment_id'] ?? null,
                'subtotal'        => 0,
                'tax_rate'        => $data['tax_rate'] ?? 0,
                'tax_amount'      => 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'grand_total'     => 0,
                'currency'        => $data['currency'] ?? 'EUR',
                'status'          => 'pending',
                'payment_method'  => $data['payment_method'] ?? null,
                'notes'           => $data['notes'] ?? null,
                'issue_date'      => $data['issue_date'] ?? now()->toDateString(),
                'due_date'        => $data['due_date'] ?? null,
            ]);

            // Create line items
            foreach ($data['items'] as $item) {
                $qty = (int) ($item['quantity'] ?? 1);
                $unitPrice = (float) $item['unit_price'];
                $totalPrice = round($qty * $unitPrice, 2);

                InvoiceItem::create([
                    'invoice_id'  => $invoice->id,
                    'description' => $item['description'],
                    'category'    => $item['category'] ?? null,
                    'quantity'    => $qty,
                    'unit_price'  => $unitPrice,
                    'total_price' => $totalPrice,
                ]);
            }

            // Recalculate totals
            $invoice->recalculate();
            $invoice->load('items', 'patient:id,fullname,email,mobile', 'doctor:id,fullname');

            return $invoice;
        });
    }

    /**
     * Update invoice (status, payment, notes).
     */
    public function updateInvoice(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            $fillable = ['status', 'paid_amount', 'payment_method', 'notes', 'tax_rate', 'discount_amount', 'due_date'];

            $update = array_intersect_key($data, array_flip($fillable));

            if (isset($data['status']) && $data['status'] === 'paid') {
                $update['paid_amount'] = $invoice->grand_total;
                $update['paid_at'] = now();
            }

            $invoice->update($update);

            // If tax_rate or discount changed, recalculate
            if (isset($data['tax_rate']) || isset($data['discount_amount'])) {
                $invoice->recalculate();
            }

            // Auto-determine status from paid_amount
            if (isset($data['paid_amount']) && !isset($data['status'])) {
                $paidAmount = (float) $data['paid_amount'];
                if ($paidAmount >= (float) $invoice->grand_total) {
                    $invoice->update(['status' => 'paid', 'paid_at' => now()]);
                } elseif ($paidAmount > 0) {
                    $invoice->update(['status' => 'partial']);
                }
            }

            $invoice->load('items', 'patient:id,fullname,email,mobile', 'doctor:id,fullname');
            return $invoice;
        });
    }

    /**
     * Cancel (soft-delete) an invoice.
     */
    public function cancelInvoice(Invoice $invoice): void
    {
        $invoice->update(['status' => 'cancelled']);
        $invoice->delete();
    }

    /**
     * Get single invoice with full relations.
     */
    public function getInvoice(string $id): ?Invoice
    {
        return Invoice::with([
            'items',
            'patient:id,fullname,email,mobile,avatar,country,date_of_birth,gender',
            'doctor:id,fullname,email',
            'clinic:id,name,address,avatar',
        ])->find($id);
    }

    // ══════════════════════════════════════════════
    //  PDF GENERATION
    // ══════════════════════════════════════════════

    /**
     * Generate a professional invoice PDF.
     */
    public function generatePdf(Invoice $invoice): \Barryvdh\DomPDF\PDF
    {
        $invoice->load([
            'items',
            'patient:id,fullname,email,mobile,country',
            'doctor:id,fullname,email',
            'clinic:id,name,address,avatar',
        ]);

        $html = $this->buildPdfHtml($invoice);

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', true);
    }

    private function buildPdfHtml(Invoice $invoice): string
    {
        $clinic = $invoice->clinic;
        $patient = $invoice->patient;
        $doctor = $invoice->doctor;
        $items = $invoice->items;

        $clinicName = $clinic->name ?? 'MedGama Clinic';
        $clinicAddress = $clinic->address ?? '';
        $patientName = $patient->fullname ?? 'Patient';
        $patientEmail = $patient->email ?? '';
        $patientMobile = $patient->mobile ?? '';
        $doctorName = $doctor->fullname ?? 'Doctor';
        $invoiceNo = $invoice->invoice_number;
        $issueDate = $invoice->issue_date?->format('d/m/Y') ?? '';
        $dueDate = $invoice->due_date?->format('d/m/Y') ?? '—';
        $currency = $invoice->currency ?? 'EUR';

        $statusLabel = ucfirst($invoice->status);
        $statusColor = match ($invoice->status) {
            'paid'      => '#059669',
            'partial'   => '#D97706',
            'cancelled' => '#DC2626',
            default     => '#6B7280',
        };

        // Build items rows
        $itemRows = '';
        foreach ($items as $i => $item) {
            $num = $i + 1;
            $itemRows .= "
            <tr>
                <td style='padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;'>{$num}</td>
                <td style='padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;font-weight:500;'>" . e($item->description) . "
                    " . ($item->category ? "<br><span style='font-size:11px;color:#9CA3AF;'>" . e($item->category) . "</span>" : "") . "
                </td>
                <td style='padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;text-align:center;'>{$item->quantity}</td>
                <td style='padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;text-align:right;'>{$currency} " . number_format($item->unit_price, 2) . "</td>
                <td style='padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;font-weight:600;text-align:right;'>{$currency} " . number_format($item->total_price, 2) . "</td>
            </tr>";
        }

        $subtotal = number_format($invoice->subtotal, 2);
        $taxLabel = "Tax ({$invoice->tax_rate}%)";
        $taxAmount = number_format($invoice->tax_amount, 2);
        $discount = number_format($invoice->discount_amount, 2);
        $grandTotal = number_format($invoice->grand_total, 2);
        $paidAmount = number_format($invoice->paid_amount, 2);
        $remaining = number_format($invoice->remainingAmount(), 2);
        $notes = $invoice->notes ? e($invoice->notes) : '';

        // Barcode (Code 128 simulated with invoice number display)
        $barcodeText = $invoiceNo;

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #111827; font-size: 13px; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 50px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #0D9488; padding-bottom: 20px; }
    .logo-section h1 { margin: 0; font-size: 24px; color: #0D9488; font-weight: 700; }
    .logo-section p { margin: 4px 0 0; font-size: 12px; color: #6B7280; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { margin: 0; font-size: 28px; color: #111827; font-weight: 700; letter-spacing: -0.5px; }
    .invoice-title .inv-no { font-size: 14px; color: #0D9488; font-weight: 600; margin-top: 4px; }
    .invoice-title .status { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }
    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .meta-box { width: 48%; }
    .meta-box h4 { margin: 0 0 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; font-weight: 700; }
    .meta-box p { margin: 2px 0; font-size: 13px; color: #374151; }
    .meta-box .name { font-weight: 600; color: #111827; font-size: 15px; }
    .dates-grid { display: flex; gap: 30px; margin-bottom: 30px; background: #F9FAFB; border-radius: 8px; padding: 14px 20px; }
    .dates-grid .d-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #9CA3AF; font-weight: 700; }
    .dates-grid .d-item p { margin: 2px 0 0; font-size: 13px; color: #111827; font-weight: 600; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items thead th { padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280; font-weight: 700; border-bottom: 2px solid #E5E7EB; text-align: left; }
    table.items thead th.right { text-align: right; }
    table.items thead th.center { text-align: center; }
    .totals { width: 300px; margin-left: auto; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals .row.label { color: #6B7280; }
    .totals .row.value { color: #111827; font-weight: 500; }
    .totals .grand { border-top: 2px solid #0D9488; padding-top: 10px; margin-top: 6px; }
    .totals .grand .label { font-size: 15px; color: #111827; font-weight: 700; }
    .totals .grand .value { font-size: 18px; color: #0D9488; font-weight: 700; }
    .footer { margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; }
    .footer .barcode { font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 4px; color: #374151; margin-bottom: 6px; font-weight: 700; }
    .footer .barcode-bars { display: inline-block; padding: 6px 20px; border: 2px solid #374151; border-radius: 6px; margin-bottom: 10px; }
    .footer .powered { font-size: 10px; color: #9CA3AF; }
    .notes-box { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
    .notes-box h4 { margin: 0 0 4px; font-size: 11px; color: #92400E; font-weight: 700; text-transform: uppercase; }
    .notes-box p { margin: 0; font-size: 12px; color: #78350F; }
    .payment-info { display: flex; gap: 20px; margin-top: 10px; }
    .payment-info .pi { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 8px 14px; }
    .payment-info .pi label { font-size: 10px; color: #166534; font-weight: 700; text-transform: uppercase; }
    .payment-info .pi p { margin: 2px 0 0; font-size: 14px; color: #166534; font-weight: 700; }
</style>
</head>
<body>
<div class="container">
    <!-- Header -->
    <div class="header">
        <div class="logo-section">
            <h1>{$clinicName}</h1>
            <p>{$clinicAddress}</p>
        </div>
        <div class="invoice-title">
            <h2>INVOICE</h2>
            <div class="inv-no">{$invoiceNo}</div>
            <div class="status" style="background:{$statusColor}15;color:{$statusColor};border:1px solid {$statusColor}40;">{$statusLabel}</div>
        </div>
    </div>

    <!-- Bill To / Doctor -->
    <div class="meta-grid">
        <div class="meta-box">
            <h4>Bill To</h4>
            <p class="name">{$patientName}</p>
            <p>{$patientEmail}</p>
            <p>{$patientMobile}</p>
        </div>
        <div class="meta-box" style="text-align:right;">
            <h4>Attending Physician</h4>
            <p class="name">{$doctorName}</p>
        </div>
    </div>

    <!-- Dates -->
    <div class="dates-grid">
        <div class="d-item"><label>Issue Date</label><p>{$issueDate}</p></div>
        <div class="d-item"><label>Due Date</label><p>{$dueDate}</p></div>
        <div class="d-item"><label>Currency</label><p>{$currency}</p></div>
    </div>

    <!-- Items Table -->
    <table class="items">
        <thead>
            <tr>
                <th style="width:40px;">#</th>
                <th>Description</th>
                <th class="center" style="width:60px;">Qty</th>
                <th class="right" style="width:120px;">Unit Price</th>
                <th class="right" style="width:120px;">Total</th>
            </tr>
        </thead>
        <tbody>
            {$itemRows}
        </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
        <div class="row"><span class="label">Subtotal</span><span class="value">{$currency} {$subtotal}</span></div>
        <div class="row"><span class="label">{$taxLabel}</span><span class="value">{$currency} {$taxAmount}</span></div>
        <div class="row"><span class="label">Discount</span><span class="value">- {$currency} {$discount}</span></div>
        <div class="row grand"><span class="label">Grand Total</span><span class="value">{$currency} {$grandTotal}</span></div>
    </div>

    <!-- Payment Info -->
    <div class="payment-info">
        <div class="pi"><label>Paid</label><p>{$currency} {$paidAmount}</p></div>
        <div class="pi"><label>Remaining</label><p>{$currency} {$remaining}</p></div>
    </div>

    <!-- Notes -->
    {$notes ? "<div class='notes-box'><h4>Notes</h4><p>{$notes}</p></div>" : ""}

    <!-- Footer with barcode -->
    <div class="footer">
        <div class="barcode-bars"><span class="barcode">{$barcodeText}</span></div>
        <div class="powered">Generated by MedGama CRM · medgama.com</div>
    </div>
</div>
</body>
</html>
HTML;
    }

    // ══════════════════════════════════════════════
    //  REVENUE / STATISTICS
    // ══════════════════════════════════════════════

    /**
     * Dashboard stats — currency-aware.
     *
     * When $currency is provided → returns flat stats for that single currency.
     * When $currency is null     → returns per-currency breakdown + available_currencies.
     */
    public function getStats(User $user, ?string $currency = null): array
    {
        $baseQuery = Invoice::query();
        $this->scopeQuery($baseQuery, $user);

        // Available currencies used in any invoice
        $currencies = (clone $baseQuery)->distinct()->pluck('currency')->sort()->values()->toArray();

        // If no invoices yet, return empty shell
        if (empty($currencies)) {
            return [
                'available_currencies' => [],
                'currency'             => $currency ?? 'EUR',
                'total_invoices'       => 0,
                'total_revenue'        => 0,
                'monthly_revenue'      => 0,
                'today_revenue'        => 0,
                'expected_revenue'     => 0,
                'receivable_amount'    => 0,
                'pending_amount'       => 0,
                'partial_paid'         => 0,
                'partial_remaining'    => 0,
                'overdue_count'        => 0,
                'by_currency'          => [],
            ];
        }

        // Default to first available currency if none specified
        $activeCurrency = $currency ?? $currencies[0] ?? 'EUR';

        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();

        // Build stats for a specific currency
        $buildForCurrency = function (string $cur) use ($baseQuery, $today, $monthStart) {
            $q = (clone $baseQuery)->where('currency', $cur);

            $totalInvoices    = (clone $q)->count();
            $totalRevenue     = (clone $q)->paid()->sum('grand_total');
            $monthlyRevenue   = (clone $q)->paid()->where('paid_at', '>=', $monthStart)->sum('grand_total');
            $todayRevenue     = (clone $q)->paid()->whereDate('paid_at', $today)->sum('grand_total');
            $pendingAmount    = (clone $q)->where('status', 'pending')->sum('grand_total');
            $partialPaid      = (clone $q)->where('status', 'partial')->sum('paid_amount');
            $partialRemaining = (clone $q)->where('status', 'partial')->sum(DB::raw('grand_total - paid_amount'));
            $expectedRevenue  = (clone $q)->whereIn('status', ['pending', 'partial'])->sum('grand_total');
            $receivableAmount = (clone $q)->whereIn('status', ['pending', 'partial'])->sum(DB::raw('grand_total - paid_amount'));
            $overdueCount     = (clone $q)->where('status', 'pending')->whereNotNull('due_date')->where('due_date', '<', $today)->count();

            return [
                'currency'          => $cur,
                'total_invoices'    => $totalInvoices,
                'total_revenue'     => round((float) $totalRevenue, 2),
                'monthly_revenue'   => round((float) $monthlyRevenue, 2),
                'today_revenue'     => round((float) $todayRevenue, 2),
                'expected_revenue'  => round((float) $expectedRevenue, 2),
                'receivable_amount' => round((float) $receivableAmount, 2),
                'pending_amount'    => round((float) $pendingAmount, 2),
                'partial_paid'      => round((float) $partialPaid, 2),
                'partial_remaining' => round((float) $partialRemaining, 2),
                'overdue_count'     => $overdueCount,
            ];
        };

        // Primary stats for the active/selected currency
        $primary = $buildForCurrency($activeCurrency);

        // Per-currency summary (lightweight: just totals for each currency)
        $byCurrency = [];
        foreach ($currencies as $cur) {
            $cq = (clone $baseQuery)->where('currency', $cur);
            $byCurrency[] = [
                'currency'          => $cur,
                'total_revenue'     => round((float) (clone $cq)->paid()->sum('grand_total'), 2),
                'receivable_amount' => round((float) (clone $cq)->whereIn('status', ['pending', 'partial'])->sum(DB::raw('grand_total - paid_amount')), 2),
                'invoice_count'     => (clone $cq)->count(),
            ];
        }

        return array_merge($primary, [
            'available_currencies' => $currencies,
            'by_currency'          => $byCurrency,
        ]);
    }

    /**
     * Revenue chart data: daily, weekly, or monthly aggregation.
     */
    public function getRevenueChart(User $user, string $period = 'monthly', ?string $year = null, ?string $currency = null): array
    {
        $year = $year ?? now()->format('Y');
        $query = Invoice::query()->paid();
        $this->scopeQuery($query, $user);

        // Filter by currency to avoid mixing EUR + USD + TRY totals
        if ($currency) {
            $query->where('currency', $currency);
        } else {
            // Default to the most-used currency
            $defaultCurrency = (clone $query)->select('currency')
                ->groupBy('currency')
                ->orderByRaw('COUNT(*) DESC')
                ->limit(1)
                ->value('currency') ?? 'EUR';
            $query->where('currency', $defaultCurrency);
        }

        if ($period === 'daily') {
            // Last 30 days
            $start = Carbon::now()->subDays(29)->startOfDay();
            $rows = (clone $query)
                ->where('paid_at', '>=', $start)
                ->select(DB::raw("DATE(paid_at) as date"), DB::raw('SUM(grand_total) as total'))
                ->groupBy(DB::raw('DATE(paid_at)'))
                ->orderBy('date')
                ->get()
                ->keyBy('date');

            $result = [];
            for ($d = $start->copy(); $d->lte(now()); $d->addDay()) {
                $key = $d->toDateString();
                $result[] = [
                    'label' => $d->format('d M'),
                    'date'  => $key,
                    'total' => round((float) ($rows[$key]->total ?? 0), 2),
                ];
            }
            return $result;
        }

        if ($period === 'weekly') {
            // Last 12 weeks
            $start = Carbon::now()->subWeeks(11)->startOfWeek();
            $rows = (clone $query)
                ->where('paid_at', '>=', $start)
                ->select(
                    DB::raw("EXTRACT(ISOYEAR FROM paid_at) as yr"),
                    DB::raw("EXTRACT(WEEK FROM paid_at) as wk"),
                    DB::raw('SUM(grand_total) as total')
                )
                ->groupBy(DB::raw("EXTRACT(ISOYEAR FROM paid_at)"), DB::raw("EXTRACT(WEEK FROM paid_at)"))
                ->orderBy('yr')->orderBy('wk')
                ->get();

            return $rows->map(fn($r) => [
                'label' => "W{$r->wk}",
                'total' => round((float) $r->total, 2),
            ])->values()->toArray();
        }

        // Monthly (default)
        $rows = (clone $query)
            ->whereYear('paid_at', $year)
            ->select(
                DB::raw("EXTRACT(MONTH FROM paid_at) as month"),
                DB::raw('SUM(grand_total) as total')
            )
            ->groupBy(DB::raw("EXTRACT(MONTH FROM paid_at)"))
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $result[] = [
                'label' => $months[$m - 1],
                'month' => $m,
                'total' => round((float) ($rows[$m]->total ?? 0), 2),
            ];
        }
        return $result;
    }

    /**
     * Outstanding balances (patients with pending/partial invoices).
     */
    public function getOutstandingBalances(User $user, int $limit = 20): array
    {
        $query = Invoice::query()
            ->whereIn('status', ['pending', 'partial'])
            ->with(['patient:id,fullname,email,mobile,avatar', 'items']);
        $this->scopeQuery($query, $user);

        $invoices = $query->orderByDesc('issue_date')->limit($limit)->get();

        // Group by patient
        $grouped = $invoices->groupBy('patient_id')->map(function ($patientInvoices) {
            $patient = $patientInvoices->first()->patient;
            $totalOwed = $patientInvoices->sum(fn($inv) => $inv->remainingAmount());

            return [
                'patient'       => $patient ? [
                    'id'       => $patient->id,
                    'fullname' => $patient->fullname,
                    'email'    => $patient->email,
                    'mobile'   => $patient->mobile,
                    'avatar'   => $patient->avatar,
                ] : null,
                'total_owed'    => round($totalOwed, 2),
                'invoice_count' => $patientInvoices->count(),
                'invoices'      => $patientInvoices->map(fn($inv) => [
                    'id'             => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'grand_total'    => $inv->grand_total,
                    'paid_amount'    => $inv->paid_amount,
                    'remaining'      => $inv->remainingAmount(),
                    'status'         => $inv->status,
                    'issue_date'     => $inv->issue_date?->toDateString(),
                    'due_date'       => $inv->due_date?->toDateString(),
                    'overdue'        => $inv->due_date && $inv->due_date->isPast(),
                ])->values(),
            ];
        })->sortByDesc('total_owed')->values();

        return $grouped->toArray();
    }

    // ══════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════

    /**
     * Scope query by user role: clinicOwner sees clinic invoices, doctor sees own.
     */
    private function scopeQuery($query, User $user): void
    {
        $role = $user->role_id;

        if (in_array($role, ['superAdmin', 'saasAdmin'])) {
            return; // see all
        }

        if ($role === 'clinicOwner') {
            $clinicId = $user->ownedClinic?->id ?? $user->clinic_id;
            if ($clinicId) {
                $query->where('clinic_id', $clinicId);
            } else {
                $query->where('doctor_id', $user->id);
            }
        } elseif ($role === 'hospital') {
            // Hospital admin sees all clinic invoices under their hospital
            $clinicIds = \App\Models\Clinic::where('hospital_id', $user->hospital_id)->pluck('id');
            $query->whereIn('clinic_id', $clinicIds);
        } else {
            // Doctor sees own invoices
            $query->where('doctor_id', $user->id);
        }
    }

    private function resolveClinicId(User $user): ?string
    {
        if ($user->role_id === 'clinicOwner') {
            return $user->ownedClinic?->id ?? $user->clinic_id;
        }
        return $user->clinic_id;
    }

    private function resolveDoctorId(User $user): string
    {
        // If clinicOwner, might not be the doctor themselves — use provided or self
        return $user->id;
    }
}
