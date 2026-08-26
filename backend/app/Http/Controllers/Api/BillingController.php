<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BillingController extends Controller
{
    public function __construct(private BillingService $billing) {}

    /**
     * GET /crm/billing/invoices — List invoices with filters.
     */
    public function index(Request $request): JsonResponse
    {
        // Validate ile filtre alanlarını whitelist'e bağla — $request->all() güvenli değil
        $filters = $request->validate([
            'status'   => 'nullable|string|in:pending,paid,cancelled,refunded,partial',
            'from'     => 'nullable|date',
            'to'       => 'nullable|date',
            'page'     => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);
        $invoices = $this->billing->listInvoices($request->user(), $filters);
        return response()->json($invoices);
    }

    /**
     * GET /crm/billing/invoices/{id} — Single invoice detail.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $invoice = $this->billing->getInvoice($id, $request->user());

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        return response()->json($invoice);
    }

    /**
     * POST /crm/billing/invoices — Create a new invoice.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id'       => 'nullable|uuid|exists:users,id',
            'appointment_id'   => 'nullable|uuid|exists:appointments,id',
            'tax_rate'         => 'nullable|numeric|min:0|max:100',
            'discount_amount'  => 'nullable|numeric|min:0',
            'currency'         => 'nullable|string|max:3',
            'payment_method'   => 'nullable|string|max:30',
            'notes'            => 'nullable|string|max:2000',
            'issue_date'       => 'nullable|date',
            'due_date'         => 'nullable|date',
            'items'            => 'required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.category'    => 'nullable|string|max:100',
            'items.*.quantity'    => 'nullable|integer|min:1',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $invoice = $this->billing->createInvoice($request->user(), $validated);

        return response()->json($invoice, 201);
    }

    /**
     * PUT /crm/billing/invoices/{id} — Update invoice (status, payment, etc.).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $invoice = $this->billing->getInvoice($id, $request->user());
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $validated = $request->validate([
            'status'          => 'nullable|string|in:paid,pending,partial,cancelled',
            'paid_amount'     => 'nullable|numeric|min:0',
            'payment_method'  => 'nullable|string|max:30',
            'notes'           => 'nullable|string|max:2000',
            'tax_rate'        => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'due_date'        => 'nullable|date',
        ]);

        $invoice = $this->billing->updateInvoice($invoice, $validated);

        return response()->json($invoice);
    }

    /**
     * DELETE /crm/billing/invoices/{id} — Cancel/soft-delete.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $invoice = $this->billing->getInvoice($id, $request->user());
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $this->billing->cancelInvoice($invoice);

        return response()->json(['message' => 'Invoice cancelled']);
    }

    /**
     * GET /crm/billing/invoices/{id}/pdf — Download invoice PDF.
     */
    public function pdf(Request $request, string $id): Response|JsonResponse
    {
        $invoice = $this->billing->getInvoice($id, $request->user());
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $pdf = $this->billing->generatePdf($invoice);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }

    /**
     * GET /doctor/billing/patient-search — Autocomplete patients by name.
     */
    public function patientSearch(Request $request): JsonResponse
    {
        $q = trim($request->input('q', ''));
        // Sürücü denetimi TEK yerde: Sorgu::benzer(). Aynı satırın elle
        // tekrarlanması, sürücü kuralı değiştiğinde birinin unutulması demek.
        $likeOp = \App\Support\Sorgu::benzer();

        // Boş sorgu hasta LİSTELEMEZ.
        //
        // Desen `%%` olduğunda her kayıt eşleşiyordu: arama kutusu boşken uç
        // sistemdeki ilk on beş hastayı döndürüyordu. Arama, aranacak bir şey
        // olduğunda çalışır.
        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $kullanici = $request->user();

        $patients = \App\Models\User::where('role_id', 'patient')
            ->where(function ($query) use ($q, $likeOp) {
                $query->where('fullname', $likeOp, "%{$q}%")
                      ->orWhere('email', $likeOp, "%{$q}%");
            })
            // Kapsam koşulu YOKTU: rota `role:doctor` arkasında olduğu için
            // sistemdeki herhangi bir hekim, hiç görmediği hastaları adının
            // parçasıyla arayıp e-posta adreslerini alabiliyordu. Bir sağlık
            // platformunda kişinin burada hesabı olması tedavi arıyor olduğunu
            // ima eder; eşleşmenin kendisi hassas.
            ->whereHas('patientAppointments', function ($q2) use ($kullanici) {
                if ($kullanici->isDoctor()) {
                    $q2->where('doctor_id', $kullanici->id);

                    return;
                }

                // Boş `clinic_id` ile kapsamak, kapsamı GENİŞLETİR: Laravel
                // `where('clinic_id', null)` ifadesini `IS NULL` yapıyor ve
                // kliniğe bağlı olmayan bütün randevuları eşliyor. Bağ yoksa
                // sonuç boş olmalı. (Bu tuzağı BosKapsamDegeriTest yakaladı —
                // ilk yazdığım hâli tam olarak bu hataya düşüyordu.)
                $kullanici->clinic_id
                    ? $q2->where('clinic_id', $kullanici->clinic_id)
                    : $q2->whereRaw('1 = 0');
            })
            ->select('id', 'fullname', 'email', 'avatar')
            ->limit(15)
            ->get();

        return response()->json($patients);
    }

    /**
     * GET /crm/billing/stats — Dashboard billing statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $currency = $request->input('currency'); // null = per-currency breakdown
        $stats = $this->billing->getStats($request->user(), $currency);
        return response()->json($stats);
    }

    /**
     * GET /crm/billing/revenue-chart — Revenue chart data (daily/weekly/monthly).
     */
    public function revenueChart(Request $request): JsonResponse
    {
        $period = $request->input('period', 'monthly');
        $year = $request->input('year');
        $currency = $request->input('currency');

        $data = $this->billing->getRevenueChart($request->user(), $period, $year, $currency);

        return response()->json($data);
    }

    /**
     * GET /crm/billing/outstanding — Outstanding balances by patient.
     */
    public function outstanding(Request $request): JsonResponse
    {
        $data = $this->billing->getOutstandingBalances(
            $request->user(),
            (int) $request->input('limit', 20)
        );

        return response()->json($data);
    }
}
