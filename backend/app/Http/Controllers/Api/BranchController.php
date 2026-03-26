<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BranchController extends Controller
{
    /**
     * GET /api/branches
     * List branches for the authenticated hospital owner.
     */
    public function index(Request $request): JsonResponse
    {
        $hospital = $this->resolveHospital($request);

        $branches = $hospital->branches()
            ->when($request->boolean('active_only'), fn ($q) => $q->active())
            ->withCount(['clinics', 'doctors'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $branches]);
    }

    /**
     * POST /api/branches
     */
    public function store(Request $request): JsonResponse
    {
        $hospital = $this->resolveHospital($request);

        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'address'     => 'nullable|string',
            'phone'       => 'nullable|string|max:50',
            'email'       => 'nullable|email|max:255',
            'coordinates' => 'nullable|array',
            'coordinates.lat' => 'required_with:coordinates|numeric',
            'coordinates.lng' => 'required_with:coordinates|numeric',
            'city'        => 'nullable|string|max:255',
            'country'     => 'nullable|string|max:255',
            'is_active'   => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $branch = $hospital->branches()->create($validator->validated());

        return response()->json(['data' => $branch], 201);
    }

    /**
     * GET /api/branches/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);

        $branch = $hospital->branches()
            ->withCount(['clinics', 'doctors'])
            ->with(['clinics:id,name,avatar', 'doctors:id,fullname,avatar'])
            ->findOrFail($id);

        return response()->json(['data' => $branch]);
    }

    /**
     * PUT /api/branches/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        $branch = $hospital->branches()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'        => 'sometimes|required|string|max:255',
            'address'     => 'nullable|string',
            'phone'       => 'nullable|string|max:50',
            'email'       => 'nullable|email|max:255',
            'coordinates' => 'nullable|array',
            'coordinates.lat' => 'required_with:coordinates|numeric',
            'coordinates.lng' => 'required_with:coordinates|numeric',
            'city'        => 'nullable|string|max:255',
            'country'     => 'nullable|string|max:255',
            'is_active'   => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $branch->update($validator->validated());

        return response()->json(['data' => $branch->fresh()]);
    }

    /**
     * DELETE /api/branches/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        $branch = $hospital->branches()->findOrFail($id);

        $branch->delete();

        return response()->json(['message' => 'Branch deleted successfully.']);
    }

    /**
     * POST /api/branches/{id}/assign-clinic
     */
    public function assignClinic(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        $branch = $hospital->branches()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'clinic_id'  => 'required|uuid|exists:clinics,id',
            'is_primary' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $branch->clinics()->syncWithoutDetaching([
            $request->clinic_id => ['is_primary' => $request->boolean('is_primary')],
        ]);

        return response()->json(['message' => 'Clinic assigned to branch.']);
    }

    /**
     * POST /api/branches/{id}/assign-doctor
     */
    public function assignDoctor(Request $request, string $id): JsonResponse
    {
        $hospital = $this->resolveHospital($request);
        $branch = $hospital->branches()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'doctor_id' => 'required|uuid|exists:users,id',
            'schedule'  => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $branch->doctors()->syncWithoutDetaching([
            $request->doctor_id => ['schedule' => json_encode($request->schedule)],
        ]);

        return response()->json(['message' => 'Doctor assigned to branch.']);
    }

    /**
     * Resolve the hospital owned by the authenticated user.
     */
    private function resolveHospital(Request $request)
    {
        $user = $request->user();

        $hospital = $user->ownedHospital ?? $user->hospital;

        if (!$hospital) {
            abort(403, 'No hospital associated with this account.');
        }

        return $hospital;
    }
}
