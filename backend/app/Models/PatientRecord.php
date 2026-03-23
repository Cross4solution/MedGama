<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

class PatientRecord extends Model
{
    use HasFactory, HasUuids, LogsActivity, MassPrunable, SoftDeletes;

    protected static string $auditResourceLabel = 'PatientRecord';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id', 'clinic_id', 'doctor_id', 'appointment_id',
        'file_url', 'upload_date', 'record_type', 'description',
        // Examination fields
        'diagnosis_note', 'vitals',
        'examination_note', 'treatment_plan', 'prescriptions',
    ];

    protected function casts(): array
    {
        return [
            'upload_date'      => 'date',
            'is_active'        => 'boolean',
            // GDPR Art. 9 — All medical data encrypted at rest
            'description'      => 'encrypted',
            'diagnosis_note'   => 'encrypted',
            'examination_note' => 'encrypted',
            'treatment_plan'   => 'encrypted',
            'vitals'           => 'encrypted:array',
            'prescriptions'    => 'encrypted:array',
        ];
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 10 year retention for health data) ──

    public function prunable()
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYears(10));
    }

    // ── Dynamic Attributes ──

    /**
     * Vitals alert data — set dynamically by ExaminationService.
     * Not persisted to database; computed on read.
     */
    public ?array $vitals_alert = null;

    public function toArray()
    {
        $array = parent::toArray();

        if ($this->vitals_alert !== null) {
            $array['vitals_alert'] = $this->vitals_alert;
        }

        return $array;
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeExaminations($query)
    {
        return $query->where('record_type', 'examination');
    }

    // ── Relationships ──

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function treatmentTags()
    {
        return $this->belongsToMany(TreatmentTag::class, 'patient_record_treatment_tag');
    }
}
