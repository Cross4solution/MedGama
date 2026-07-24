<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DigitalAnamnesis;
use App\Models\HealthDataAuditLog;
use Illuminate\Http\Request;

class DigitalAnamnesisController extends Controller
{
    /**
     * Anamnez erişimi: ya kaydın sahibi hasta ya da klinik rol (doktor/klinik/
     * hastane/admin). Aksi halde hasta-hasta arası PHI sızıntısı (IDOR) olurdu.
     */
    private function authorizeAnamnesisAccess(Request $request, string $patientId): void
    {
        $user = $request->user();
        $clinicalRoles = ['doctor', 'clinicOwner', 'clinic', 'hospital', 'superAdmin', 'saasAdmin'];
        $isOwner = $user->id === $patientId;
        $isClinical = in_array($user->role_id, $clinicalRoles, true);
        if (!$isOwner && !$isClinical) {
            abort(403, 'You are not authorized to access this medical record.');
        }
    }

    public function show(Request $request, string $patientId)
    {
        $this->authorizeAnamnesisAccess($request, $patientId);

        $anamnesis = DigitalAnamnesis::active()->where('patient_id', $patientId)->first();

        if (!$anamnesis) {
            return response()->json(['anamnesis' => null]);
        }

        // HIPAA/GDPR Audit: log health data access
        HealthDataAuditLog::log(
            accessorId: $request->user()->id,
            patientId: $patientId,
            resourceType: 'digital_anamnesis',
            resourceId: $anamnesis->id,
        );

        return response()->json(['anamnesis' => $anamnesis]);
    }

    public function upsert(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:users,id',
            'answers' => 'required|array',
        ]);

        // Yazma yetkisi: kaydın sahibi hasta ya da klinik rol.
        $this->authorizeAnamnesisAccess($request, $validated['patient_id']);

        $anamnesis = DigitalAnamnesis::updateOrCreate(
            ['patient_id' => $validated['patient_id']],
            [
                'answers' => $validated['answers'],
                'doctor_id' => $request->user()->isDoctor() ? $request->user()->id : null,
                'clinic_id' => $request->user()->clinic_id,
                'last_updated_by' => $request->user()->id,
            ]
        );

        return response()->json(['anamnesis' => $anamnesis]);
    }
}
