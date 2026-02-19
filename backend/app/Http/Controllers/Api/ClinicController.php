<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $clinic = DB::transaction(function () use ($validated) {
            $clinic = Clinic::create($validated);

            // Update owner role
            User::where('id', $validated['owner_id'])->update([
                'role_id' => 'clinicOwner',
                'clinic_id' => $clinic->id,
            ]);

            return $clinic;
        });

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

        return response()->json(['clinic' => $clinic->refresh()]);
    }

    /**
     * GET /api/clinics/{id}/staff — Clinic staff list
     */
    public function staff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $staff = User::active()
            ->where('clinic_id', $clinic->id)
            ->with('doctorProfile:id,user_id,title,specialty,experience_years,onboarding_completed')
            ->select('id', 'fullname', 'email', 'avatar', 'role_id', 'is_verified', 'clinic_id', 'created_at')
            ->paginate($request->per_page ?? 50);

        return response()->json($staff);
    }

    /**
     * POST /api/clinics/{id}/staff — Create a doctor under this clinic
     */
    public function createStaff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $user = $request->user();
        if ($clinic->owner_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'fullname'  => 'required|string|max:255',
            'email'     => 'required|email|max:255',
            'password'  => 'required|string|min:6|max:100',
            'mobile'    => 'nullable|string|max:20',
            // Doctor profile fields (optional)
            'title'     => 'nullable|string|max:255',
            'specialty' => 'nullable|string|max:255',
            'bio'       => 'nullable|string|max:5000',
            'experience_years' => 'nullable|string|max:50',
        ]);

        // Check if email already exists in this clinic
        $exists = User::where('email', $validated['email'])->where('clinic_id', $clinic->id)->exists();
        if ($exists) {
            return response()->json(['message' => 'A user with this email already exists in this clinic.'], 422);
        }

        $doctor = DB::transaction(function () use ($validated, $clinic) {
            $doctor = User::create([
                'fullname'       => $validated['fullname'],
                'email'          => $validated['email'],
                'password'       => bcrypt($validated['password']),
                'mobile'         => $validated['mobile'] ?? null,
                'role_id'        => 'doctor',
                'clinic_id'      => $clinic->id,
                'is_active'      => true,
                'email_verified' => true, // Clinic-created accounts are pre-verified
            ]);

            // Create doctor profile if any profile fields provided
            $profileFields = array_filter([
                'title'            => $validated['title'] ?? null,
                'specialty'        => $validated['specialty'] ?? null,
                'bio'              => $validated['bio'] ?? null,
                'experience_years' => $validated['experience_years'] ?? null,
            ]);

            if (!empty($profileFields)) {
                $doctor->doctorProfile()->create(array_merge($profileFields, [
                    'onboarding_completed' => false,
                    'onboarding_step'      => 0,
                ]));
            }

            return $doctor;
        });

        return response()->json([
            'doctor'  => $doctor->load('doctorProfile'),
            'message' => 'Doctor account created successfully.',
        ], 201);
    }
}
