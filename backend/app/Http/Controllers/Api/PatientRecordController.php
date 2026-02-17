<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use Illuminate\Http\Request;

class PatientRecordController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = PatientRecord::active()->with(['patient:id,fullname,avatar', 'doctor:id,fullname,avatar']);

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v))
              ->when($request->record_type, fn($q, $v) => $q->where('record_type', $v));

        return response()->json($query->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'clinic_id' => 'sometimes|uuid|exists:clinics,id',
            'file_url' => 'required|string|url',
            'record_type' => 'required|in:labResult,report,scan,other',
            'description' => 'sometimes|string|max:500',
        ]);

        $validated['doctor_id'] = $request->user()->id;
        $validated['upload_date'] = now()->toDateString();

        $record = PatientRecord::create($validated);

        return response()->json(['record' => $record], 201);
    }

    public function show(string $id)
    {
        return response()->json(['record' => PatientRecord::active()->with(['patient:id,fullname', 'doctor:id,fullname'])->findOrFail($id)]);
    }

    public function destroy(string $id)
    {
        PatientRecord::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'Record deleted.']);
    }
}
