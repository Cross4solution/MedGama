<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmProcessStage extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'doctor_id', 'patient_id', 'clinic_id', 'stage', 'started_at', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }
}
