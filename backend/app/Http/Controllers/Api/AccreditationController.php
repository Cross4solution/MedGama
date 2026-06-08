<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccreditationResource;
use App\Models\Accreditation;
use App\Models\Clinic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccreditationController extends Controller
{
    /**
     * GET /api/accreditations
     * List all available accreditations (for dropdown)
     */
    public function index(Request $request): JsonResponse
    {
        $accreditations = Accreditation::active()
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => AccreditationResource::collection($accreditations)]);
    }

    /**
     * GET /api/clinics/{clinicId}/accreditations
     * Get accreditations for a specific clinic
     */
    public function clinicAccreditations(string $clinicId): JsonResponse
    {
        $clinic = Clinic::findOrFail($clinicId);

        $accreditations = $clinic->accreditations()
            ->get()
            ->map(fn($acc) => [
                'id' => $acc->id,
                'name' => $acc->name,
                'description' => $acc->description,
                'icon' => $acc->icon,
                'certificate_number' => $acc->pivot->certificate_number,
                'issued_at' => $acc->pivot->issued_at,
                'expires_at' => $acc->pivot->expires_at,
                'document_url' => $acc->pivot->document_url,
                'is_verified' => $acc->pivot->is_verified,
            ]);

        return response()->json(['data' => $accreditations]);
    }

    /**
     * POST /api/clinics/{clinicId}/accreditations
     * Attach/update accreditations for a clinic
     * Body: { accreditation_ids: ["id1", "id2"], ...pivot data }
     */
    public function attachAccreditations(Request $request, string $clinicId): JsonResponse
    {
        $clinic = Clinic::findOrFail($clinicId);

        $this->authorize('update', $clinic);

        $validated = $request->validate([
            'accreditation_ids' => 'required|array|min:0',
            'accreditation_ids.*' => 'uuid|exists:accreditations,id',
            'certificate_number' => 'nullable|array',
            'certificate_number.*' => 'nullable|string|max:100',
            'issued_at' => 'nullable|array',
            'issued_at.*' => 'nullable|date',
            'expires_at' => 'nullable|array',
            'expires_at.*' => 'nullable|date',
            'document_url' => 'nullable|array',
            'document_url.*' => 'nullable|url',
        ]);

        // Detach all existing accreditations
        $clinic->accreditations()->detach();

        // Attach selected accreditations with pivot data
        $syncData = [];
        foreach ($validated['accreditation_ids'] as $index => $accreditationId) {
            $syncData[$accreditationId] = [
                'certificate_number' => $validated['certificate_number'][$index] ?? null,
                'issued_at' => $validated['issued_at'][$index] ?? null,
                'expires_at' => $validated['expires_at'][$index] ?? null,
                'document_url' => $validated['document_url'][$index] ?? null,
                'is_verified' => false, // Only admins can verify
            ];
        }

        $clinic->accreditations()->sync($syncData);

        return response()->json([
            'message' => 'Accreditations updated successfully.',
            'data' => $clinic->accreditations->makeHidden(['pivot']),
        ]);
    }

    /**
     * DELETE /api/clinics/{clinicId}/accreditations/{accreditationId}
     * Remove a specific accreditation from clinic
     */
    public function detachAccreditation(string $clinicId, string $accreditationId): JsonResponse
    {
        $clinic = Clinic::findOrFail($clinicId);

        $this->authorize('update', $clinic);

        $clinic->accreditations()->detach($accreditationId);

        return response()->json(['message' => 'Accreditation removed.']);
    }
}
