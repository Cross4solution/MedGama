<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DoctorReview extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'doctor_id',
        'patient_id',
        'appointment_id',
        'rating',
        'comment',
        'is_verified',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'rating'      => 'integer',
            'is_verified' => 'boolean',
            'is_visible'  => 'boolean',
        ];
    }

    // ── Scopes ──

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    // ── Relationships ──

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
