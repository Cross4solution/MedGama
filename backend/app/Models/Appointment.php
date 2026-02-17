<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id', 'doctor_id', 'clinic_id', 'appointment_type', 'slot_id',
        'appointment_date', 'appointment_time', 'status', 'confirmation_note',
        'video_conference_link', 'doctor_note', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
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

    public function slot()
    {
        return $this->belongsTo(CalendarSlot::class, 'slot_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
