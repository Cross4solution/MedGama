<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClinicController extends Controller
{
    /**
     * GET /api/clinics — Public brief list
     */
    public function index(Request $request)
    {
        $clinics = Clinic::active()
            ->when($request->name, fn($q, $v) => $q->where('fullname', 'like', "%{$v}%"))
            ->select('id', 'name', 'codename', 'fullname', 'avatar', 'address', 'is_verified')
            ->paginate($request->per_page ?? 20);

        return response()->json($clinics);
    }

    /**
     * GET /api/clinics/{codename} — Public detail
     */
    public function show(string $codename)
    {
        $clinic = Clinic::active()->where('codename', $codename)->firstOrFail();

        return response()->json(['clinic' => $clinic->load('owner:id,fullname,avatar')]);
    }

    /**
     * POST /api/clinics — Admin only
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'fullname' => 'required|string|max:255',
            'owner_id' => 'required|uuid|exists:users,id',
            'address' => 'sometimes|string',
            'biography' => 'sometimes|string',
            'map_coordinates' => 'sometimes|array',
            'website' => 'sometimes|url',
        ]);

        $validated['codename'] = Str::slug($validated['name']) . '-' . Str::random(4);
        $validated['avatar'] = 'https://gravatar.com/avatar/' . md5(strtolower($validated['fullname'])) . '?s=200&d=identicon';

        $clinic = Clinic::create($validated);

        // Update owner role
        User::where('id', $validated['owner_id'])->update([
            'role_id' => 'clinicOwner',
            'clinic_id' => $clinic->id,
        ]);

        return response()->json(['clinic' => $clinic], 201);
    }

    /**
     * PUT /api/clinics/{id} — Clinic owner/admin
     */
    public function update(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $user = $request->user();
        if ($clinic->owner_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'fullname' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|string|url',
            'address' => 'sometimes|string',
            'biography' => 'sometimes|string',
            'map_coordinates' => 'sometimes|array',
            'website' => 'sometimes|url',
        ]);

        $clinic->update($validated);

        return response()->json(['clinic' => $clinic->fresh()]);
    }

    /**
     * GET /api/clinics/{id}/staff — Clinic staff list
     */
    public function staff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $staff = User::active()
            ->where('clinic_id', $clinic->id)
            ->select('id', 'fullname', 'email', 'avatar', 'role_id', 'is_verified')
            ->paginate($request->per_page ?? 20);

        return response()->json($staff);
    }
}
