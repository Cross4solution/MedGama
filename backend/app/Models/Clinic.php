<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

class Clinic extends Model
{
    use HasFactory, HasUuids, LogsActivity, MassPrunable, SoftDeletes;

    protected static string $auditResourceLabel = 'Clinic';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name', 'codename', 'fullname', 'avatar', 'owner_id', 'hospital_id',
        'address', 'biography', 'map_coordinates', 'website', 'is_verified',
        'is_crm_active', 'crm_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'map_coordinates' => 'array',
            'is_verified'    => 'boolean',
            'is_active'      => 'boolean',
            'is_crm_active'  => 'boolean',
            'crm_expires_at' => 'datetime',
        ];
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 3 year retention after soft-delete) ──

    public function prunable()
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYears(3));
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * The hospital this clinic belongs to (nullable — independent clinics have no hospital).
     */
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function staff()
    {
        return $this->hasMany(User::class, 'clinic_id');
    }

    public function doctors()
    {
        return $this->hasMany(User::class, 'clinic_id')->where('role_id', 'doctor');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function calendarSlots()
    {
        return $this->hasMany(CalendarSlot::class);
    }

    public function archivedRecords()
    {
        return $this->hasMany(ArchivedClinicRecord::class);
    }
}
