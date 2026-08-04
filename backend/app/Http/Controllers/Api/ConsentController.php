<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsentRecord;
use App\Services\ConsentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
    public function __construct(private ConsentService $consents)
    {
    }

    /** GET /consents — kullanıcının verdiği onayların güncel durumu. */
    public function index(Request $request): JsonResponse
    {
        $locale = str_starts_with(app()->getLocale(), 'tr') ? 'tr' : 'en';

        return response()->json([
            'data' => $this->consents->statusFor($request->user(), $locale),
        ]);
    }

    /** GET /consents/history — denetim/şeffaflık için tam geçmiş (onay + geri alma). */
    public function history(Request $request): JsonResponse
    {
        $records = ConsentRecord::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get(['id', 'type', 'version', 'granted_at', 'revoked_at', 'source', 'created_at']);

        return response()->json(['data' => $records]);
    }

    /** POST /consents/{type} — onay ver. */
    public function grant(string $type, Request $request): JsonResponse
    {
        $record = $this->consents->grant($request->user(), $type, 'profile');

        if (!$record) {
            return response()->json(['message' => 'Unknown consent type.'], 422);
        }

        return response()->json(['message' => 'Consent granted.', 'granted_at' => $record->granted_at?->toISOString()]);
    }

    /** DELETE /consents/{type} — onayı geri al (yalnız geri alınabilir tipler). */
    public function revoke(string $type, Request $request): JsonResponse
    {
        $ok = $this->consents->revoke($request->user(), $type);

        if (!$ok) {
            return response()->json([
                'message' => 'This consent cannot be withdrawn here. It is required to provide the service; use your data rights to close your account.',
            ], 422);
        }

        return response()->json(['message' => 'Consent withdrawn.']);
    }
}
