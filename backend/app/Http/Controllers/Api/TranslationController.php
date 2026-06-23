<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranslationController extends Controller
{
    public function __construct(private TranslationService $translator) {}

    /**
     * POST /api/translate — on-demand machine translation (cached).
     * Body: { text, target, source? }
     */
    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text'   => 'required|string|max:5000',
            'target' => 'required|string|max:8',
            'source' => 'nullable|string|max:8',
        ]);

        $result = $this->translator->translate(
            $validated['text'],
            $validated['target'],
            $validated['source'] ?? null,
        );

        return response()->json($result);
    }
}
