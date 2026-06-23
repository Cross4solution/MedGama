<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VascoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VascoController extends Controller
{
    public function __construct(private VascoService $vasco) {}

    /**
     * POST /api/vasco/suggest — symptom → best specialty + ranked member doctors.
     * Body: { text, lang?, location? }. Vasco never diagnoses.
     */
    public function suggest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text'     => 'required|string|max:2000',
            'lang'     => 'nullable|string|max:8',
            'location' => 'nullable|string|max:120',
        ]);

        $result = $this->vasco->suggest(
            $validated['text'],
            $validated['lang'] ?? 'tr',
            $validated['location'] ?? null,
        );

        return response()->json($result);
    }
}
