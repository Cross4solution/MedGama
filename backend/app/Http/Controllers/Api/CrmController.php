<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmTag;
use App\Models\CrmProcessStage;
use App\Models\ArchivedClinicRecord;
use Illuminate\Http\Request;

class CrmController extends Controller
{
    // ── CRM Tags ──

    public function tags(Request $request)
    {
        $user = $request->user();
        $query = CrmTag::active();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v));

        return response()->json($query->orderByDesc('created_at')->paginate($request->per_page ?? 50));
    }

    public function storeTag(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'tag' => 'required|string|max:100',
        ]);

        $tag = CrmTag::create([
            'doctor_id' => $request->user()->id,
            'patient_id' => $validated['patient_id'],
            'clinic_id' => $request->user()->clinic_id,
            'tag' => $validated['tag'],
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['tag' => $tag], 201);
    }

    public function destroyTag(string $id)
    {
        CrmTag::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'Tag deleted.']);
    }

    // ── CRM Process Stages ──

    public function stages(Request $request)
    {
        $user = $request->user();
        $query = CrmProcessStage::active();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v));

        return response()->json($query->orderByDesc('created_at')->paginate($request->per_page ?? 50));
    }

    public function storeStage(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'stage' => 'required|string|max:100',
        ]);

        $stage = CrmProcessStage::create([
            'doctor_id' => $request->user()->id,
            'patient_id' => $validated['patient_id'],
            'clinic_id' => $request->user()->clinic_id,
            'stage' => $validated['stage'],
            'started_at' => now()->toDateString(),
            'updated_by' => $request->user()->id,
        ]);

        return response()->json(['stage' => $stage], 201);
    }

    public function updateStage(Request $request, string $id)
    {
        $stage = CrmProcessStage::active()->findOrFail($id);

        $validated = $request->validate([
            'stage' => 'required|string|max:100',
        ]);

        $stage->update([
            'stage' => $validated['stage'],
            'updated_by' => $request->user()->id,
        ]);

        return response()->json(['stage' => $stage->refresh()]);
    }

    // ── Archived Clinic Records ──

    public function archivedRecords(Request $request)
    {
        $user = $request->user();
        $query = ArchivedClinicRecord::active()->with(['formerDoctor:id,fullname', 'archivedPatient:id,fullname']);

        if ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        return response()->json($query->orderByDesc('archived_at')->paginate($request->per_page ?? 20));
    }

    public function storeArchivedRecord(Request $request)
    {
        $validated = $request->validate([
            'former_doctor_id' => 'required|uuid|exists:users,id',
            'archived_patient_id' => 'required|uuid|exists:users,id',
            'record_references' => 'sometimes|array',
        ]);

        $record = ArchivedClinicRecord::create([
            'former_doctor_id' => $validated['former_doctor_id'],
            'clinic_id' => $request->user()->clinic_id,
            'archived_patient_id' => $validated['archived_patient_id'],
            'record_references' => $validated['record_references'] ?? [],
            'archived_at' => now()->toDateString(),
        ]);

        return response()->json(['record' => $record], 201);
    }
}
