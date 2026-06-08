<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    public const STAGES = ['new', 'contacted', 'proposal', 'won', 'lost'];

    protected $fillable = [
        'clinic_id', 'assigned_to', 'full_name', 'email', 'phone', 'source',
        'treatment_interest', 'stage', 'notes', 'estimated_value', 'lost_reason',
        'converted_patient_id', 'last_contacted_at',
    ];

    protected function casts(): array
    {
        return [
            'notes'             => 'encrypted', // PHI — encrypt at rest
            'estimated_value'   => 'decimal:2',
            'last_contacted_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function convertedPatient()
    {
        return $this->belongsTo(User::class, 'converted_patient_id');
    }

    public function activities()
    {
        return $this->hasMany(LeadActivity::class)->orderByDesc('created_at');
    }
}
