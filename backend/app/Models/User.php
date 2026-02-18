<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'email', 'password', 'fullname', 'avatar', 'role_id', 'mobile',
        'mobile_verified', 'email_verified', 'email_verification_code',
        'password_reset_code', 'password_reset_expires_at',
        'city_id', 'country_id',
        'date_of_birth', 'gender', 'is_verified', 'last_login', 'clinic_id',
        'medical_history', 'notification_preferences',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'mobile_verified' => 'boolean',
            'email_verified' => 'boolean',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
            'date_of_birth' => 'date',
            'last_login' => 'datetime',
        ];
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRole($query, string $role)
    {
        return $query->where('role_id', $role);
    }

    public function scopePatients($query)
    {
        return $query->where('role_id', 'patient');
    }

    public function scopeDoctors($query)
    {
        return $query->where('role_id', 'doctor');
    }

    // ── Relationships ──

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function ownedClinic()
    {
        return $this->hasOne(Clinic::class, 'owner_id');
    }

    public function doctorAppointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    public function patientAppointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function calendarSlots()
    {
        return $this->hasMany(CalendarSlot::class, 'doctor_id');
    }

    public function digitalAnamnesis()
    {
        return $this->hasOne(DigitalAnamnesis::class, 'patient_id');
    }

    public function patientRecords()
    {
        return $this->hasMany(PatientRecord::class, 'patient_id');
    }

    public function crmTags()
    {
        return $this->hasMany(CrmTag::class, 'patient_id');
    }

    public function medStreamPosts()
    {
        return $this->hasMany(MedStreamPost::class, 'author_id');
    }

    public function bookmarks()
    {
        return $this->hasMany(MedStreamBookmark::class, 'user_id');
    }

    // ── Helpers ──

    public function isAdmin(): bool
    {
        return in_array($this->role_id, ['superAdmin', 'saasAdmin']);
    }

    public function isDoctor(): bool
    {
        return $this->role_id === 'doctor';
    }

    public function isPatient(): bool
    {
        return $this->role_id === 'patient';
    }

    public function isClinicOwner(): bool
    {
        return $this->role_id === 'clinicOwner';
    }
}
