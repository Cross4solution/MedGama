<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CrmProcessStage;
use App\Models\CrmTag;
use App\Models\HealthDataAuditLog;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PatientService
{
    // ══════════════════════════════════════════════
    //  PATIENT LIST (with tags, stages, stats)
    // ══════════════════════════════════════════════

    /**
     * List patients visible to the authenticated doctor/clinic.
     * Includes last appointment, tags, and current process stage.
     */
    public function listPatients(User $user, array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->where('role_id', 'patient')
            ->where('is_active', true);

        // Scope: only patients who have appointments with this doctor/clinic
        if ($user->isDoctor()) {
            $query->whereHas('patientAppointments', function ($q) use ($user) {
                $q->where('doctor_id', $user->id);
            });
        } elseif ($user->isClinicOwner()) {
            $query->whereHas('patientAppointments', function ($q) use ($user) {
                $q->where('clinic_id', $user->clinic_id);
            });
        }

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('fullname', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('mobile', 'ilike', "%{$search}%");
            });
        }

        // Tag filter — patients who have a specific tag
        if (!empty($filters['tag'])) {
            $tag = $filters['tag'];
            $query->whereHas('crmTags', function ($q) use ($tag, $user) {
                $q->active()->where('tag', $tag);
                if ($user->isDoctor()) {
                    $q->where('doctor_id', $user->id);
                } elseif ($user->isClinicOwner()) {
                    $q->where('clinic_id', $user->clinic_id);
                }
            });
        }

        // Process stage filter
        if (!empty($filters['stage'])) {
            $stage = $filters['stage'];
            $query->whereHas('crmProcessStages', function ($q) use ($stage, $user) {
                $q->active()->where('stage', $stage);
                if ($user->isDoctor()) {
                    $q->where('doctor_id', $user->id);
                } elseif ($user->isClinicOwner()) {
                    $q->where('clinic_id', $user->clinic_id);
                }
            });
        }

        // Gender filter
        if (!empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        $paginator = $query
            ->select('id', 'fullname', 'email', 'mobile', 'avatar', 'date_of_birth', 'gender', 'country', 'is_verified', 'created_at')
            ->orderBy($filters['sort_by'] ?? 'fullname', $filters['sort_dir'] ?? 'asc')
            ->paginate($filters['per_page'] ?? 20);

        // Enrich each patient with tags, stage, and last appointment
        $patientIds = $paginator->getCollection()->pluck('id')->toArray();

        $doctorScope = $user->isDoctor() ? $user->id : null;
        $clinicScope = $user->isClinicOwner() ? $user->clinic_id : null;

        // Batch load tags
        $tagsMap = $this->batchLoadTags($patientIds, $doctorScope, $clinicScope);

        // Batch load current stages
        $stagesMap = $this->batchLoadStages($patientIds, $doctorScope, $clinicScope);

        // Batch load last appointment
        $lastAppointmentMap = $this->batchLoadLastAppointments($patientIds, $doctorScope, $clinicScope);

        // Batch load total visits
        $visitCountMap = $this->batchLoadVisitCounts($patientIds, $doctorScope, $clinicScope);

        $paginator->getCollection()->transform(function ($patient) use ($tagsMap, $stagesMap, $lastAppointmentMap, $visitCountMap) {
            $patient->tags = $tagsMap[$patient->id] ?? [];
            $patient->current_stage = $stagesMap[$patient->id] ?? null;
            $patient->last_appointment = $lastAppointmentMap[$patient->id] ?? null;
            $patient->total_visits = $visitCountMap[$patient->id] ?? 0;
            return $patient;
        });

        return $paginator;
    }

    /**
     * Get distinct tags used by this doctor/clinic for filter dropdown.
     */
    public function getDistinctTags(User $user): Collection
    {
        $query = CrmTag::active()->select('tag')->distinct();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        return $query->orderBy('tag')->pluck('tag');
    }

    /**
     * Get distinct stages used by this doctor/clinic for filter dropdown.
     */
    public function getDistinctStages(User $user): Collection
    {
        $query = CrmProcessStage::active()->select('stage')->distinct();

        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        return $query->orderBy('stage')->pluck('stage');
    }

    /**
     * Get patient stats for dashboard cards.
     */
    public function getPatientStats(User $user): array
    {
        $baseQuery = User::query()
            ->where('role_id', 'patient')
            ->where('is_active', true);

        if ($user->isDoctor()) {
            $baseQuery->whereHas('patientAppointments', fn($q) => $q->where('doctor_id', $user->id));
        } elseif ($user->isClinicOwner()) {
            $baseQuery->whereHas('patientAppointments', fn($q) => $q->where('clinic_id', $user->clinic_id));
        }

        $total = (clone $baseQuery)->count();

        // New this month
        $newThisMonth = (clone $baseQuery)->where('created_at', '>=', now()->startOfMonth())->count();

        // Patients with appointments this month
        $activeThisMonth = (clone $baseQuery)->whereHas('patientAppointments', function ($q) {
            $q->where('appointment_date', '>=', now()->startOfMonth())
              ->where('appointment_date', '<=', now()->endOfMonth())
              ->whereIn('status', ['confirmed', 'completed']);
        })->count();

        return [
            'total' => $total,
            'new_this_month' => $newThisMonth,
            'active_this_month' => $activeThisMonth,
        ];
    }

    // ══════════════════════════════════════════════
    //  PATIENT 360° — Full Profile
    // ══════════════════════════════════════════════

    /**
     * Get comprehensive patient 360° data.
     * Logs access for GDPR compliance.
     */
    public function getPatient360(string $patientId, User $accessor): array
    {
        $patient = User::where('role_id', 'patient')
            ->where('is_active', true)
            ->findOrFail($patientId);

        // GDPR Art. 9 — Audit every access to patient profile
        HealthDataAuditLog::log(
            accessorId: $accessor->id,
            patientId: $patient->id,
            resourceType: 'patient_360',
            resourceId: $patient->id,
            action: 'view',
        );

        $doctorScope = $accessor->isDoctor() ? $accessor->id : null;
        $clinicScope = $accessor->isClinicOwner() ? $accessor->clinic_id : null;

        return [
            'patient' => $this->formatPatientProfile($patient),
            'tags' => $this->getPatientTags($patient->id, $doctorScope, $clinicScope),
            'current_stage' => $this->getCurrentStage($patient->id, $doctorScope, $clinicScope),
            'stats' => $this->getPatientVisitStats($patient->id, $doctorScope, $clinicScope),
        ];
    }

    /**
     * Get chronological timeline for a patient.
     * Merges appointments, examinations, and lab records.
     */
    public function getPatientTimeline(string $patientId, User $accessor, array $filters): array
    {
        $doctorScope = $accessor->isDoctor() ? $accessor->id : null;
        $clinicScope = $accessor->isClinicOwner() ? $accessor->clinic_id : null;

        $items = collect();

        // 1. Appointments
        $apptQuery = Appointment::where('patient_id', $patientId)
            ->where('is_active', true)
            ->with(['doctor:id,fullname,avatar']);

        if ($doctorScope) {
            $apptQuery->where('doctor_id', $doctorScope);
        } elseif ($clinicScope) {
            $apptQuery->where('clinic_id', $clinicScope);
        }

        $appointments = $apptQuery->orderByDesc('appointment_date')->get();

        foreach ($appointments as $appt) {
            $items->push([
                'id' => $appt->id,
                'type' => 'appointment',
                'subtype' => $appt->appointment_type,
                'title' => ucfirst($appt->appointment_type) . ' Appointment',
                'date' => $appt->appointment_date->toDateString(),
                'time' => $appt->appointment_time,
                'status' => $appt->status,
                'doctor' => $appt->doctor?->fullname ?? 'Unknown',
                'doctor_avatar' => $appt->doctor?->avatar,
                'notes' => $appt->confirmation_note,
                'sort_key' => $appt->appointment_date->toDateString() . ' ' . $appt->appointment_time,
            ]);
        }

        // 2. Examinations
        $examQuery = PatientRecord::active()
            ->examinations()
            ->where('patient_id', $patientId)
            ->with(['doctor:id,fullname,avatar', 'appointment:id,appointment_date,appointment_time']);

        if ($doctorScope) {
            $examQuery->where('doctor_id', $doctorScope);
        } elseif ($clinicScope) {
            $examQuery->where('clinic_id', $clinicScope);
        }

        $examinations = $examQuery->orderByDesc('created_at')->get();

        foreach ($examinations as $exam) {
            $items->push([
                'id' => $exam->id,
                'type' => 'examination',
                'subtype' => null,
                'title' => $exam->icd10_code
                    ? "Examination — {$exam->icd10_code}"
                    : 'Examination',
                'date' => $exam->created_at->toDateString(),
                'time' => $exam->created_at->format('H:i'),
                'status' => null,
                'doctor' => $exam->doctor?->fullname ?? 'Unknown',
                'doctor_avatar' => $exam->doctor?->avatar,
                'notes' => $exam->diagnosis_note,
                'vitals' => $exam->vitals,
                'prescriptions' => $exam->prescriptions,
                'icd10_code' => $exam->icd10_code,
                'sort_key' => $exam->created_at->toDateTimeString(),
            ]);
        }

        // 3. Lab results, scans, reports (non-examination patient records)
        $recordQuery = PatientRecord::active()
            ->where('patient_id', $patientId)
            ->where('record_type', '!=', 'examination')
            ->with(['doctor:id,fullname,avatar']);

        if ($doctorScope) {
            $recordQuery->where('doctor_id', $doctorScope);
        } elseif ($clinicScope) {
            $recordQuery->where('clinic_id', $clinicScope);
        }

        $records = $recordQuery->orderByDesc('created_at')->get();

        foreach ($records as $rec) {
            $items->push([
                'id' => $rec->id,
                'type' => 'document',
                'subtype' => $rec->record_type,
                'title' => ucfirst(str_replace(['labResult', 'scan'], ['Lab Result', 'Scan'], $rec->record_type)),
                'date' => ($rec->upload_date ?? $rec->created_at)->toDateString(),
                'time' => $rec->created_at->format('H:i'),
                'status' => null,
                'doctor' => $rec->doctor?->fullname ?? 'Unknown',
                'doctor_avatar' => $rec->doctor?->avatar,
                'notes' => $rec->description,
                'file_url' => $rec->file_url,
                'sort_key' => ($rec->upload_date ?? $rec->created_at)->toDateString() . ' ' . $rec->created_at->format('H:i:s'),
            ]);
        }

        // Sort all items descending by date
        $sorted = $items->sortByDesc('sort_key')->values();

        // Type filter
        if (!empty($filters['type'])) {
            $sorted = $sorted->where('type', $filters['type'])->values();
        }

        return $sorted->toArray();
    }

    /**
     * Get medical summary: latest vitals, active prescriptions, chronic conditions (from tags).
     */
    public function getMedicalSummary(string $patientId, User $accessor): array
    {
        $doctorScope = $accessor->isDoctor() ? $accessor->id : null;
        $clinicScope = $accessor->isClinicOwner() ? $accessor->clinic_id : null;

        // Latest vitals from most recent examination
        $latestExam = PatientRecord::active()
            ->examinations()
            ->where('patient_id', $patientId)
            ->whereNotNull('vitals')
            ->when($doctorScope, fn($q) => $q->where('doctor_id', $doctorScope))
            ->when($clinicScope, fn($q) => $q->where('clinic_id', $clinicScope))
            ->orderByDesc('created_at')
            ->first();

        // Active prescriptions from last 3 examinations
        $recentExams = PatientRecord::active()
            ->examinations()
            ->where('patient_id', $patientId)
            ->whereNotNull('prescriptions')
            ->when($doctorScope, fn($q) => $q->where('doctor_id', $doctorScope))
            ->when($clinicScope, fn($q) => $q->where('clinic_id', $clinicScope))
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        $activePrescriptions = [];
        foreach ($recentExams as $exam) {
            if (is_array($exam->prescriptions)) {
                foreach ($exam->prescriptions as $rx) {
                    $activePrescriptions[] = [
                        'prescription' => $rx,
                        'date' => $exam->created_at->toDateString(),
                        'doctor' => $exam->doctor?->fullname ?? 'Unknown',
                    ];
                }
            }
        }

        // Chronic conditions from tags (e.g., tags with keyword 'chronic', 'diabetes', etc.)
        $tags = CrmTag::active()
            ->where('patient_id', $patientId)
            ->when($doctorScope, fn($q) => $q->where('doctor_id', $doctorScope))
            ->when($clinicScope, fn($q) => $q->where('clinic_id', $clinicScope))
            ->pluck('tag')
            ->toArray();

        // Recent diagnoses (ICD-10 codes)
        $recentDiagnoses = PatientRecord::active()
            ->examinations()
            ->where('patient_id', $patientId)
            ->whereNotNull('icd10_code')
            ->when($doctorScope, fn($q) => $q->where('doctor_id', $doctorScope))
            ->when($clinicScope, fn($q) => $q->where('clinic_id', $clinicScope))
            ->orderByDesc('created_at')
            ->limit(5)
            ->select('icd10_code', 'diagnosis_note', 'created_at')
            ->get()
            ->toArray();

        return [
            'latest_vitals' => $latestExam ? [
                'data' => $latestExam->vitals,
                'date' => $latestExam->created_at->toDateString(),
                'doctor' => $latestExam->doctor?->fullname ?? 'Unknown',
            ] : null,
            'active_prescriptions' => $activePrescriptions,
            'tags' => $tags,
            'recent_diagnoses' => $recentDiagnoses,
        ];
    }

    /**
     * Get patient documents (non-examination records).
     */
    public function getPatientDocuments(string $patientId, User $accessor, array $filters): LengthAwarePaginator
    {
        $query = PatientRecord::active()
            ->where('patient_id', $patientId)
            ->where('record_type', '!=', 'examination')
            ->with(['doctor:id,fullname,avatar']);

        if ($accessor->isDoctor()) {
            $query->where('doctor_id', $accessor->id);
        } elseif ($accessor->isClinicOwner()) {
            $query->where('clinic_id', $accessor->clinic_id);
        }

        if (!empty($filters['record_type'])) {
            $query->where('record_type', $filters['record_type']);
        }

        // GDPR Audit
        HealthDataAuditLog::log(
            accessorId: $accessor->id,
            patientId: $patientId,
            resourceType: 'patient_documents',
            resourceId: $patientId,
            action: 'list',
        );

        return $query->orderByDesc('created_at')->paginate($filters['per_page'] ?? 20);
    }

    // ══════════════════════════════════════════════
    //  TAG & STAGE MANAGEMENT
    // ══════════════════════════════════════════════

    public function addTag(string $patientId, User $user, string $tag): CrmTag
    {
        // Check patient exists
        User::where('role_id', 'patient')->findOrFail($patientId);

        return CrmTag::create([
            'doctor_id' => $user->isDoctor() ? $user->id : $user->id,
            'patient_id' => $patientId,
            'clinic_id' => $user->clinic_id,
            'tag' => $tag,
            'created_by' => $user->id,
        ]);
    }

    public function removeTag(string $tagId, User $user): void
    {
        $query = CrmTag::active();
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        $query->findOrFail($tagId)->update(['is_active' => false]);
    }

    public function setStage(string $patientId, User $user, string $stage): CrmProcessStage
    {
        // Check patient exists
        User::where('role_id', 'patient')->findOrFail($patientId);

        // Deactivate old stages for this patient (by this doctor/clinic)
        CrmProcessStage::active()
            ->where('patient_id', $patientId)
            ->when($user->isDoctor(), fn($q) => $q->where('doctor_id', $user->id))
            ->when($user->isClinicOwner(), fn($q) => $q->where('clinic_id', $user->clinic_id))
            ->update(['is_active' => false]);

        return CrmProcessStage::create([
            'doctor_id' => $user->isDoctor() ? $user->id : $user->id,
            'patient_id' => $patientId,
            'clinic_id' => $user->clinic_id,
            'stage' => $stage,
            'started_at' => now()->toDateString(),
            'updated_by' => $user->id,
        ]);
    }

    // ══════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ══════════════════════════════════════════════

    private function batchLoadTags(array $patientIds, ?string $doctorId, ?string $clinicId): array
    {
        if (empty($patientIds)) return [];

        $query = CrmTag::active()->whereIn('patient_id', $patientIds);
        if ($doctorId) $query->where('doctor_id', $doctorId);
        elseif ($clinicId) $query->where('clinic_id', $clinicId);

        return $query->get()
            ->groupBy('patient_id')
            ->map(fn($tags) => $tags->pluck('tag', 'id')->map(fn($tag, $id) => ['id' => $id, 'tag' => $tag])->values())
            ->toArray();
    }

    private function batchLoadStages(array $patientIds, ?string $doctorId, ?string $clinicId): array
    {
        if (empty($patientIds)) return [];

        $query = CrmProcessStage::active()->whereIn('patient_id', $patientIds);
        if ($doctorId) $query->where('doctor_id', $doctorId);
        elseif ($clinicId) $query->where('clinic_id', $clinicId);

        // Get the latest stage per patient
        return $query->orderByDesc('created_at')
            ->get()
            ->groupBy('patient_id')
            ->map(fn($stages) => [
                'id' => $stages->first()->id,
                'stage' => $stages->first()->stage,
                'started_at' => $stages->first()->started_at?->toDateString(),
            ])
            ->toArray();
    }

    private function batchLoadLastAppointments(array $patientIds, ?string $doctorId, ?string $clinicId): array
    {
        if (empty($patientIds)) return [];

        $query = Appointment::whereIn('patient_id', $patientIds)
            ->where('is_active', true);
        if ($doctorId) $query->where('doctor_id', $doctorId);
        elseif ($clinicId) $query->where('clinic_id', $clinicId);

        return $query->orderByDesc('appointment_date')
            ->get()
            ->groupBy('patient_id')
            ->map(fn($appts) => [
                'date' => $appts->first()->appointment_date->toDateString(),
                'type' => $appts->first()->appointment_type,
                'status' => $appts->first()->status,
            ])
            ->toArray();
    }

    private function batchLoadVisitCounts(array $patientIds, ?string $doctorId, ?string $clinicId): array
    {
        if (empty($patientIds)) return [];

        $query = Appointment::whereIn('patient_id', $patientIds)
            ->where('is_active', true)
            ->where('status', 'completed');
        if ($doctorId) $query->where('doctor_id', $doctorId);
        elseif ($clinicId) $query->where('clinic_id', $clinicId);

        return $query->selectRaw('patient_id, count(*) as cnt')
            ->groupBy('patient_id')
            ->pluck('cnt', 'patient_id')
            ->toArray();
    }

    private function formatPatientProfile(User $patient): array
    {
        return [
            'id' => $patient->id,
            'fullname' => $patient->fullname,
            'email' => $patient->email,
            'mobile' => $patient->mobile,
            'avatar' => $patient->avatar,
            'date_of_birth' => $patient->date_of_birth?->toDateString(),
            'gender' => $patient->gender,
            'country' => $patient->country,
            'is_verified' => $patient->is_verified,
            'created_at' => $patient->created_at->toDateString(),
        ];
    }

    private function getPatientTags(string $patientId, ?string $doctorId, ?string $clinicId): array
    {
        $query = CrmTag::active()->where('patient_id', $patientId);
        if ($doctorId) $query->where('doctor_id', $doctorId);
        elseif ($clinicId) $query->where('clinic_id', $clinicId);

        return $query->select('id', 'tag', 'created_at')
            ->orderByDesc('created_at')
            ->get()
            ->toArray();
    }

    private function getCurrentStage(string $patientId, ?string $doctorId, ?string $clinicId): ?array
    {
        $query = CrmProcessStage::active()->where('patient_id', $patientId);
        if ($doctorId) $query->where('doctor_id', $doctorId);
        elseif ($clinicId) $query->where('clinic_id', $clinicId);

        $stage = $query->orderByDesc('created_at')->first();

        return $stage ? [
            'id' => $stage->id,
            'stage' => $stage->stage,
            'started_at' => $stage->started_at?->toDateString(),
        ] : null;
    }

    private function getPatientVisitStats(string $patientId, ?string $doctorId, ?string $clinicId): array
    {
        $apptQuery = Appointment::where('patient_id', $patientId)
            ->where('is_active', true);
        if ($doctorId) $apptQuery->where('doctor_id', $doctorId);
        elseif ($clinicId) $apptQuery->where('clinic_id', $clinicId);

        $total = (clone $apptQuery)->count();
        $completed = (clone $apptQuery)->where('status', 'completed')->count();
        $upcoming = (clone $apptQuery)->where('appointment_date', '>=', now()->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])->count();

        $examCount = PatientRecord::active()
            ->examinations()
            ->where('patient_id', $patientId)
            ->when($doctorId, fn($q) => $q->where('doctor_id', $doctorId))
            ->when($clinicId, fn($q) => $q->where('clinic_id', $clinicId))
            ->count();

        return [
            'total_appointments' => $total,
            'completed_visits' => $completed,
            'upcoming_appointments' => $upcoming,
            'total_examinations' => $examCount,
        ];
    }
}
