<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DigitalAnamnesis extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'digital_anamneses';

    protected $fillable = [
        'patient_id', 'doctor_id', 'clinic_id', 'answers', 'last_updated_by',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

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
