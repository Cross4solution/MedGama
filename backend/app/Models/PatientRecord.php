<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientRecord extends Model
{
    use HasFactory, HasUuids, MassPrunable, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id', 'clinic_id', 'doctor_id', 'file_url',
        'upload_date', 'record_type', 'description',
    ];

    protected function casts(): array
    {
        return [
            'upload_date'  => 'date',
            'is_active'    => 'boolean',
            'description'  => 'encrypted',
        ];
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 10 year retention for health data) ──

    public function prunable()
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYears(10));
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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
}
