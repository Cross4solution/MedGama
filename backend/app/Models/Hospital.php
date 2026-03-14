<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hospital extends Model
{
    use HasFactory, HasUuids, MassPrunable, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'codename',
        'fullname',
        'avatar',
        'owner_id',
        'address',
        'biography',
        'phone',
        'email',
        'website',
        'map_coordinates',
        'city',
        'country',
        'tax_number',
        'is_verified',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'map_coordinates' => 'array',
            'is_verified'     => 'boolean',
            'is_active'       => 'boolean',
            'biography'       => 'encrypted',
            'tax_number'      => 'encrypted',
        ];
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 3 year retention after soft-delete) ──

    public function prunable()
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYears(3));
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relationships ──

    /**
     * The primary administrator / owner of this hospital.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * A Hospital has many Clinics (One-to-Many).
     */
    public function clinics()
    {
        return $this->hasMany(Clinic::class);
    }

    /**
     * All staff users that belong to this hospital directly.
     */
    public function staff()
    {
        return $this->hasMany(User::class, 'hospital_id');
    }

    /**
     * Appointments across all clinics of this hospital.
     */
    public function appointments()
    {
        return $this->hasManyThrough(Appointment::class, Clinic::class);
    }
}
