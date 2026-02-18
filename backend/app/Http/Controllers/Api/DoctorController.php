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
            ->with(['doctorProfile:id,user_id,title,specialty,experience_years,address,online_consultation,bio'])
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified');

        $query->when($request->clinic_id, fn($q, $v) => $q->where('clinic_id', $v))
              ->when($request->city_id, fn($q, $v) => $q->where('city_id', $v))
              ->when($request->search, fn($q, $v) => $q->where('fullname', 'like', "%{$v}%"))
              ->when($request->specialty, fn($q, $v) => $q->whereHas('doctorProfile', fn($pq) => $pq->where('specialty', 'ilike', "%{$v}%")));

        $doctors = $query->orderBy('fullname')->paginate($request->per_page ?? 50);

        return response()->json($doctors);
    }

    /**
     * GET /api/doctors/{id} — Public doctor profile (full detail)
     */
    public function show(string $id)
    {
        $doctor = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->with(['doctorProfile', 'clinic:id,name,codename,avatar,address'])
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified', 'gender')
            ->findOrFail($id);

        return response()->json(['doctor' => $doctor]);
    }
}
