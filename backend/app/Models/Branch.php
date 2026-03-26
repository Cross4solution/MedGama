<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'hospital_id',
        'name',
        'address',
        'phone',
        'email',
        'coordinates',
        'city',
        'country',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'coordinates' => 'array',
            'is_active'   => 'boolean',
        ];
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relationships ──

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function clinics()
    {
        return $this->belongsToMany(Clinic::class, 'clinic_branches')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function doctors()
    {
        return $this->belongsToMany(User::class, 'doctor_branches', 'branch_id', 'doctor_id')
            ->withPivot('schedule')
            ->withTimestamps();
    }
}
