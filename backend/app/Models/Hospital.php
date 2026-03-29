<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Casts\Attribute;
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

    // ── Media URL resolution ──

    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: function (?string $value) {
                if (!$value) return null;
                if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) return $value;
                return rtrim(config('app.url'), '/') . '/' . ltrim($value, '/');
            },
        );
    }

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
     * A Hospital has many Branches (Level 4 — Promotion Network).
     */
    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    /**
     * All staff users that belong to this hospital directly.
     */
    public function staff()
    {
        return $this->hasMany(User::class, 'hospital_id');
    }

    /**
     * A Hospital has many Branches (physical locations).
     */
    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    /**
     * Appointments across all clinics of this hospital.
     */
    public function appointments()
    {
        return $this->hasManyThrough(Appointment::class, Clinic::class);
    }
}
