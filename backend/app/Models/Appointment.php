<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use HasFactory, HasUuids, MassPrunable, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id', 'doctor_id', 'clinic_id', 'appointment_type', 'slot_id',
        'appointment_date', 'appointment_time', 'status', 'confirmation_note',
        'video_conference_link', 'doctor_note', 'created_by', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date'  => 'date',
            'is_active'         => 'boolean',
            'doctor_note'       => 'encrypted',
            'confirmation_note' => 'encrypted',
        ];
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 10 year retention) ──

    public function prunable()
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYears(10));
    }

    // ── Relationships ──

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
