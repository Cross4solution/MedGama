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
        $invoices = $this->billing->listInvoices($request->user(), $request->all());
        return response()->json($invoices);
    }

    /**
     * GET /crm/billing/invoices/{id} — Single invoice detail.
     */
    public function show(string $id): JsonResponse
    {
        $invoice = $this->billing->getInvoice($id);

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
            'patient_id'       => 'required|uuid|exists:users,id',
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
        $invoice = $this->billing->getInvoice($id);
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
    public function destroy(string $id): JsonResponse
    {
        $invoice = $this->billing->getInvoice($id);
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $this->billing->cancelInvoice($invoice);

        return response()->json(['message' => 'Invoice cancelled']);
    }

    /**
     * GET /crm/billing/invoices/{id}/pdf — Download invoice PDF.
     */
    public function pdf(string $id): Response|JsonResponse
    {
        $invoice = $this->billing->getInvoice($id);
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $pdf = $this->billing->generatePdf($invoice);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
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
