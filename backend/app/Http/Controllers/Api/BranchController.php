<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Hospital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    /**
     * GET /api/branches — List branches for the authenticated hospital owner.
     */
    public function index(Request $request): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $branches = $hospital->branches()
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $branches]);
    }

    /**
     * POST /api/branches — Create a new branch.
     */
    public function store(Request $request): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'address'       => 'nullable|string|max:1000',
            'city'          => 'nullable|string|max:100',
            'country'       => 'nullable|string|max:100',
            'latitude'      => 'nullable|numeric|between:-90,90',
            'longitude'     => 'nullable|numeric|between:-180,180',
            'phone'         => 'nullable|string|max:30',
            'email'         => 'nullable|email|max:255',
            'is_active'     => 'boolean',
            'display_order' => 'integer|min:0',
        ]);

        $data['hospital_id'] = $hospital->id;
        $branch = Branch::create($data);

        return response()->json([
            'message' => 'Branch created.',
            'data'    => $branch,
        ], 201);
    }

    /**
     * GET /api/branches/{id} — Show a single branch.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $branch = $hospital->branches()->findOrFail($id);

        return response()->json(['data' => $branch]);
    }

    /**
     * PUT /api/branches/{id} — Update a branch.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $branch = $hospital->branches()->findOrFail($id);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'address'       => 'nullable|string|max:1000',
            'city'          => 'nullable|string|max:100',
            'country'       => 'nullable|string|max:100',
            'latitude'      => 'nullable|numeric|between:-90,90',
            'longitude'     => 'nullable|numeric|between:-180,180',
            'phone'         => 'nullable|string|max:30',
            'email'         => 'nullable|email|max:255',
            'is_active'     => 'boolean',
            'display_order' => 'integer|min:0',
        ]);

        $branch->update($data);

        return response()->json([
            'message' => 'Branch updated.',
            'data'    => $branch->refresh(),
        ]);
    }

    /**
     * DELETE /api/branches/{id} — Soft-delete a branch.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        if (!$hospital) {
            return response()->json(['message' => 'Hospital not found.'], 404);
        }

        $branch = $hospital->branches()->findOrFail($id);
        $branch->delete();

        return response()->json(['message' => 'Branch deleted.']);
    }

    /**
     * Resolve the hospital for the authenticated user.
     * Hospital owner (role_id=hospital) → ownedHospital
     * Admin → can pass ?hospital_id= query param
     */
    private function resolveHospital(Request $request): ?Hospital
    {
        $user = $request->user();

        if ($user->isAdmin() && $request->has('hospital_id')) {
            return Hospital::find($request->query('hospital_id'));
        }

        return $user->ownedHospital ?? ($user->hospital_id ? $user->hospital : null);
    }
}
