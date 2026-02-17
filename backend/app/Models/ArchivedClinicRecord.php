<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArchivedClinicRecord extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'former_doctor_id', 'clinic_id', 'archived_patient_id',
        'record_references', 'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'record_references' => 'array',
            'archived_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function formerDoctor()
    {
        return $this->belongsTo(User::class, 'former_doctor_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function archivedPatient()
    {
        return $this->belongsTo(User::class, 'archived_patient_id');
    }
}
