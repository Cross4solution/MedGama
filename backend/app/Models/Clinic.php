<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name', 'codename', 'fullname', 'avatar', 'owner_id',
        'address', 'biography', 'map_coordinates', 'website', 'is_verified',
    ];

    protected function casts(): array
    {
        return [
            'map_coordinates' => 'array',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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
