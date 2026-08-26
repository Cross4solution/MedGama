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

    /**
     * Budama kuyruğu.
     *
     * İki yol var ve ikisi de gerekli:
     *
     *   1. Yumuşak silinmiş kayıt — on yıl sonra kalıcı siliniyor.
     *   2. HESABINI SİLMİŞ hastanın kaydı — hasta silindikten on yıl sonra.
     *
     * İkincisi eksikti. Hesap silme tıbbi kayda dokunmuyor (klinik onu
     * görmeye devam etmeli: kliniğin kendi saklama yükümlülüğü var, GDPR
     * md. 17(3)(b) ve (h) silme hakkını burada sınırlıyor). Ama dokunmamak
     * SÜRESİZ tutmak demek değil — saklama süresi dolduğunda kayıt gitmeli.
     * Ölçüldüğünde silinen hesabın kayıtları hiçbir sayaca girmiyordu.
     *
     * Kliniğin görüşü bozulmuyor: kayıt on yıl boyunca listede kalıyor,
     * yalnız sonunda kalıcı olarak siliniyor.
     */
    public function prunable()
    {
        $hastaSutunu = 'patient_id';

        return static::withTrashed()
            ->where(function ($q) use ($hastaSutunu) {
                $q->where(function ($x) {
                    $x->whereNotNull('deleted_at')
                        ->where('deleted_at', '<=', now()->subYears(10));
                })->orWhereIn($hastaSutunu, function ($alt) {
                    $alt->select('id')->from('users')
                        ->whereNotNull('deleted_at')
                        ->where('deleted_at', '<=', now()->subYears(10));
                });
            });
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
