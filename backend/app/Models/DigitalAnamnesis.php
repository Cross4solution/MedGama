<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DigitalAnamnesis extends Model
{
    use HasFactory, HasUuids, MassPrunable, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'digital_anamneses';

    protected $fillable = [
        'patient_id', 'doctor_id', 'clinic_id', 'answers', 'last_updated_by',
    ];

    protected function casts(): array
    {
        return [
            'answers'   => 'encrypted:array',
            'is_active' => 'boolean',
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
