<?php

namespace App\Services;

use App\Models\HealthDataAuditLog;
use App\Models\PatientDocument;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ExaminationService
{
    // ══════════════════════════════════════════════
    //  EXAMINATIONS (CRUD)
    // ══════════════════════════════════════════════

    /**
     * List examinations for the authenticated doctor.
     */
    public function listExaminations(User $doctor, array $filters): LengthAwarePaginator
    {
        $paginator = PatientRecord::active()
            ->examinations()
            ->where('doctor_id', $doctor->id)
            ->with(['patient:id,fullname,avatar,date_of_birth,gender', 'appointment:id,appointment_date,appointment_time'])
            ->when($filters['patient_id'] ?? null, fn($q, $v) => $q->where('patient_id', $v))
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);

        // Append vitals alert to each record
        $paginator->getCollection()->transform(fn($record) => $this->appendVitalsAlert($record));

        return $paginator;
    }

    /**
     * Get a single examination with full details.
     * Logs health data access for GDPR compliance.
     */
    public function getExamination(string $id, User $doctor): PatientRecord
    {
        $record = PatientRecord::active()
            ->examinations()
            ->where('doctor_id', $doctor->id)
            ->with([
                'patient:id,fullname,avatar,date_of_birth,gender,mobile,email',
                'clinic:id,name,fullname,address',
                'appointment:id,appointment_date,appointment_time,appointment_type,status',
            ])
            ->findOrFail($id);

        // GDPR Art. 9 — Audit every access to health data
        HealthDataAuditLog::log(
            accessorId: $doctor->id,
            patientId: $record->patient_id,
            resourceType: 'examination',
            resourceId: $record->id,
            action: 'view',
        );

        return $this->appendVitalsAlert($record);
    }

    /**
     * Create an examination record.
     * All medical fields are encrypted via Eloquent casts.
     */
    public function createExamination(User $doctor, array $data): PatientRecord
    {
        $record = DB::transaction(function () use ($doctor, $data) {
            $record = PatientRecord::create([
                'patient_id'       => $data['patient_id'],
                'doctor_id'        => $doctor->id,
                'clinic_id'        => $data['clinic_id'] ?? $doctor->clinic_id,
                'appointment_id'   => $data['appointment_id'] ?? null,
                'record_type'      => 'examination',
                'vitals'           => $data['vitals'] ?? null,
                'examination_note' => $data['examination_note'] ?? null,
                'treatment_plan'   => $data['treatment_plan'] ?? null,
                'prescriptions'    => $data['prescriptions'] ?? null,
                'upload_date'      => now()->toDateString(),
            ]);

            // Sync treatment tags if provided
            if (!empty($data['treatment_tags'])) {
                $record->treatmentTags()->sync($data['treatment_tags']);
            }

            return $record;
        });

        // GDPR Audit — log creation
        HealthDataAuditLog::log(
            accessorId: $doctor->id,
            patientId: $record->patient_id,
            resourceType: 'examination',
            resourceId: $record->id,
            action: 'create',
        );

        $record->load([
            'patient:id,fullname,avatar',
            'appointment:id,appointment_date,appointment_time',
        ]);

        return $this->appendVitalsAlert($record);
    }

    /**
     * Update an existing examination record.
     */
    public function updateExamination(string $id, User $doctor, array $data): PatientRecord
    {
        $record = PatientRecord::active()
            ->examinations()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($id);

        DB::transaction(function () use ($record, $data) {
            $updatable = array_filter([
                'diagnosis_note'   => $data['diagnosis_note'] ?? null,
                'vitals'           => $data['vitals'] ?? null,
                'examination_note' => $data['examination_note'] ?? null,
                'treatment_plan'   => $data['treatment_plan'] ?? null,
                'prescriptions'    => $data['prescriptions'] ?? null,
                'appointment_id'   => $data['appointment_id'] ?? null,
            ], fn($v) => $v !== null);

            $record->update($updatable);

            // Sync treatment tags if provided
            if (isset($data['treatment_tags'])) {
                $record->treatmentTags()->sync($data['treatment_tags']);
            }
        });

        // GDPR Audit — log update
        HealthDataAuditLog::log(
            accessorId: $doctor->id,
            patientId: $record->patient_id,
            resourceType: 'examination',
            resourceId: $record->id,
            action: 'update',
        );

        $record->refresh()->load([
            'patient:id,fullname,avatar',
            'appointment:id,appointment_date,appointment_time',
        ]);

        return $this->appendVitalsAlert($record);
    }

    /**
     * Soft-delete an examination record.
     */
    public function deleteExamination(string $id, User $doctor): void
    {
        $record = PatientRecord::active()
            ->examinations()
            ->where('doctor_id', $doctor->id)
            ->findOrFail($id);

        $record->delete();

        // GDPR Audit — log deletion
        HealthDataAuditLog::log(
            accessorId: $doctor->id,
            patientId: $record->patient_id,
            resourceType: 'examination',
            resourceId: $record->id,
            action: 'delete',
        );
    }

    // ══════════════════════════════════════════════
    //  VITALS ALERT ANALYSIS
    // ══════════════════════════════════════════════

    /**
     * Normal reference ranges for vital signs.
     * Values outside these ranges trigger an alert.
     */
    private const VITAL_RANGES = [
        'systolic'    => ['min' => 90,   'max' => 140,  'unit' => 'mmHg', 'label' => 'Sistolik Tansiyon'],
        'diastolic'   => ['min' => 60,   'max' => 90,   'unit' => 'mmHg', 'label' => 'Diyastolik Tansiyon'],
        'pulse'       => ['min' => 60,   'max' => 100,  'unit' => 'bpm',  'label' => 'Nabız'],
        'temperature' => ['min' => 36.0, 'max' => 38.0, 'unit' => '°C',   'label' => 'Ateş'],
        'spo2'        => ['min' => 95,   'max' => 100,  'unit' => '%',    'label' => 'SpO2'],
    ];

    /**
     * Analyze vitals and return alert details for out-of-range values.
     *
     * @return array{is_alert: bool, alerts: array}
     */
    public function analyzeVitals(?array $vitals): array
    {
        if (empty($vitals)) {
            return ['is_alert' => false, 'alerts' => []];
        }

        $alerts = [];

        foreach (self::VITAL_RANGES as $key => $range) {
            if (!isset($vitals[$key])) {
                continue;
            }

            $value = (float) $vitals[$key];
            $status = 'normal';
            $message = null;

            if ($value < $range['min']) {
                $status = 'low';
                $message = "{$range['label']} düşük: {$value}{$range['unit']} (Normal: {$range['min']}–{$range['max']})";
            } elseif ($value > $range['max']) {
                $status = 'high';
                $message = "{$range['label']} yüksek: {$value}{$range['unit']} (Normal: {$range['min']}–{$range['max']})";
            }

            if ($status !== 'normal') {
                $alerts[] = [
                    'vital'   => $key,
                    'value'   => $value,
                    'unit'    => $range['unit'],
                    'status'  => $status,
                    'label'   => $range['label'],
                    'normal'  => "{$range['min']}–{$range['max']}",
                    'message' => $message,
                ];
            }
        }

        return [
            'is_alert' => !empty($alerts),
            'alerts'   => $alerts,
        ];
    }

    /**
     * Append vitals_alert to a PatientRecord instance (as a dynamic attribute).
     */
    public function appendVitalsAlert(PatientRecord $record): PatientRecord
    {
        $record->vitals_alert = $this->analyzeVitals($record->vitals);
        return $record;
    }

    // ══════════════════════════════════════════════
    //  PATIENT DOCUMENTS (Doctor access during exam)
    // ══════════════════════════════════════════════

    /**
     * Get patient documents shared with the doctor.
     * Used during examination to view patient's uploaded medical files.
     */
    public function getSharedPatientDocuments(string $patientId, User $doctor): Collection
    {
        $documents = PatientDocument::active()
            ->forPatient($patientId)
            ->sharedWith($doctor->id)
            ->orderByDesc('document_date')
            ->get();

        // GDPR Audit
        HealthDataAuditLog::log(
            accessorId: $doctor->id,
            patientId: $patientId,
            resourceType: 'patient_documents',
            resourceId: $patientId,
            action: 'exam_view',
        );

        return $documents;
    }
}
