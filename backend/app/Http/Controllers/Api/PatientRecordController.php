<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HealthDataAuditLog;
use App\Models\PatientRecord;
use Illuminate\Http\Request;

class PatientRecordController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = PatientRecord::active()->with(['patient:id,fullname,avatar', 'doctor:id,fullname,avatar']);

        // Scope: each role only sees its own records. Admins see all.
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        } elseif (!$user->isAdmin()) {
            // Unknown / unprivileged role — never expose other patients' records.
            abort(403, 'Bu kayda erişim yetkiniz yok.');
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

    public function show(string $id, Request $request)
    {
        $record = PatientRecord::active()->with(['patient:id,fullname', 'doctor:id,fullname'])->findOrFail($id);

        // IDOR guard — only owner patient / creating doctor / clinic / admin may read.
        $this->authorizeAccess($record, $request->user());

        // HIPAA/GDPR Audit: log health data access
        HealthDataAuditLog::log(
            accessorId: $request->user()->id,
            patientId: $record->patient_id,
            resourceType: 'patient_record',
            resourceId: $record->id,
            action: 'view',
        );

        return response()->json(['record' => $record]);
    }

    public function destroy(string $id, Request $request)
    {
        $record = PatientRecord::active()->findOrFail($id);
        $user = $request->user();

        // Medical records are clinic property — patients may NOT delete.
        // Only the creating doctor, the owning clinic, or an admin may delete.
        $isDoctor = $user->isDoctor() && $record->doctor_id === $user->id;
        $isClinic = $user->isClinicOwner() && $record->clinic_id && $record->clinic_id === $user->clinic_id;
        $isAdmin  = $user->isAdmin();

        if (!$isDoctor && !$isClinic && !$isAdmin) {
            abort(403, 'Bu kaydı silme yetkiniz yok.');
        }

        $record->update(['is_active' => false]);

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $record->patient_id,
            resourceType: 'patient_record',
            resourceId: $record->id,
            action: 'delete',
        );

        return response()->json(['message' => 'Record deleted.']);
    }

    // ══════════════════════════════════════════════
    //  AUTHORIZATION HELPER
    // ══════════════════════════════════════════════

    /**
     * Read access: owner patient, creating doctor, owning clinic, or admin.
     * Mirrors PatientDocumentController::authorizeAccess for consistency.
     */
    private function authorizeAccess(PatientRecord $record, $user): void
    {
        $isOwnerPatient = $record->patient_id === $user->id;
        $isDoctor       = $record->doctor_id === $user->id;
        $isClinic       = $record->clinic_id && $user->clinic_id && $record->clinic_id === $user->clinic_id;
        $isAdmin        = $user->isAdmin();

        if (!$isOwnerPatient && !$isDoctor && !$isClinic && !$isAdmin) {
            abort(403, 'Bu kayda erişim yetkiniz yok.');
        }
    }
}
