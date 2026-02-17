<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    /**
     * GET /api/doctors — Public list of doctors
     */
    public function index(Request $request)
    {
        $query = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified');

        $query->when($request->clinic_id, fn($q, $v) => $q->where('clinic_id', $v))
              ->when($request->city_id, fn($q, $v) => $q->where('city_id', $v))
              ->when($request->search, fn($q, $v) => $q->where('fullname', 'like', "%{$v}%"));

        $doctors = $query->orderBy('fullname')->paginate($request->per_page ?? 50);

        return response()->json($doctors);
    }

    /**
     * GET /api/doctors/{id} — Public doctor profile
     */
    public function show(string $id)
    {
        $doctor = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified', 'gender', 'date_of_birth')
            ->findOrFail($id);

        return response()->json(['doctor' => $doctor]);
    }
}
