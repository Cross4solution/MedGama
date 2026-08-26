<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FinanceController extends Controller
{
    public function __construct(private FinanceService $finance) {}

    /**
     * GET /api/finance/top-services
     */
    public function topServices(Request $request): JsonResponse
    {
        $data = $this->finance->topServices(
            $request->user(),
            $request->input('currency'),
            (int) $request->input('limit', 10),
        );

        return response()->json($data);
    }

    /**
     * GET /api/finance/payout
     */
    public function payout(Request $request): JsonResponse
    {
        $data = $this->finance->payoutSummary(
            $request->user(),
            $request->input('currency'),
            $request->input('period_start'),
            $request->input('period_end'),
        );

        return response()->json($data);
    }

    /**
     * GET /api/finance/platform-overview — SuperAdmin only
     */
    public function platformOverview(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role_id, ['superAdmin', 'saasAdmin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $this->finance->platformOverview(
            $request->input('currency'),
        );

        return response()->json($data);
    }



    /**
     * GET /api/finance/export — Download CSV/XLSX
     */
    public function export(Request $request): Response
    {
        $csv = $this->finance->exportCsv(
            $request->user(),
            $request->only(['status', 'currency', 'date_from', 'date_to']),
        );

        $filename = 'finance-export-' . now()->format('Y-m-d') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => \App\Support\DosyaBasligi::uret('attachment', $filename),
        ]);
    }
}
