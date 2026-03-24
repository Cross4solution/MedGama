<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Traits\LogsActivity;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, LogsActivity, MassPrunable, Notifiable, SoftDeletes;

    protected static string $auditResourceLabel = 'User';
    protected static array $auditMaskedFields = ['password', 'email_verification_code', 'password_reset_code'];
    protected static array $auditExcludedFields = ['updated_at', 'created_at', 'last_login'];

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'email', 'password', 'fullname', 'avatar', 'profile_image', 'role_id', 'user_level', 'mobile',
        'mobile_verified', 'email_verified', 'email_verification_code',
        'password_reset_code', 'password_reset_expires_at',
        'city_id', 'country_id', 'country', 'preferred_language',
        'date_of_birth', 'gender', 'is_verified', 'verification_status', 'admin_verification_note',
        'last_login', 'clinic_id', 'hospital_id',
        'medical_history', 'notification_preferences', 'clinic_name',
        'is_crm_active', 'crm_expires_at', 'added_by_clinic',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'                 => 'hashed',
            'mobile_verified'          => 'boolean',
            'email_verified'           => 'boolean',
            'is_verified'              => 'boolean',
            'is_active'                => 'boolean',
            'date_of_birth'            => 'date',
            'last_login'               => 'datetime',
            'medical_history'          => 'encrypted',
            'notification_preferences' => 'encrypted:array',
            'is_crm_active'            => 'boolean',
            'crm_expires_at'           => 'datetime',
            'added_by_clinic'          => 'boolean',
            'user_level'               => 'integer',
        ];
    }

    // ── Media URL resolution ──

    private static function resolveStoragePath(?string $value): ?string
    {
        if (!$value) return null;

        // External URLs (e.g. gravatar) — keep as-is
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            // Strip APP_URL prefix if present → return relative
            $appUrl = rtrim(config('app.url'), '/');
            if ($appUrl && str_starts_with($value, $appUrl . '/')) {
                $value = substr($value, strlen($appUrl));
            } else {
                return $value;
            }
        }

        // Normalize: ensure /storage/ prefix
        $path = ltrim($value, '/');
        if (!str_starts_with($path, 'storage/')) {
            $path = 'storage/' . $path;
        }
        // Deduplicate /storage/storage/ if legacy data
        $path = preg_replace('#^storage/storage/#', 'storage/', $path);

        return '/' . $path;
    }

    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => self::resolveStoragePath($value),
        );
    }

    protected function profileImage(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => self::resolveStoragePath($value),
        );
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 3 year retention after account deletion) ──

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

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function ownedHospital()
    {
        return $this->hasOne(Hospital::class, 'owner_id');
    }

    public function ownedClinic()
    {
        return $this->hasOne(Clinic::class, 'owner_id');
    }

    public function verificationRequests()
    {
        return $this->hasMany(VerificationRequest::class, 'doctor_id');
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

    public function crmProcessStages()
    {
        return $this->hasMany(CrmProcessStage::class, 'patient_id');
    }

    public function doctorProfile()
    {
        return $this->hasOne(DoctorProfile::class);
    }

    public function doctorReviews()
    {
        return $this->hasMany(DoctorReview::class, 'doctor_id');
    }

    public function patientReviews()
    {
        return $this->hasMany(DoctorReview::class, 'patient_id');
    }

    public function medStreamPosts()
    {
        return $this->hasMany(MedStreamPost::class, 'author_id');
    }

    public function bookmarks()
    {
        return $this->hasMany(MedStreamBookmark::class, 'user_id');
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot(['role', 'last_read_at', 'is_muted', 'is_archived', 'is_active'])
            ->withTimestamps();
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function favoriteClinics()
    {
        return $this->belongsToMany(Clinic::class, 'clinic_favorites')
            ->withTimestamps();
    }

    // ── Social: Follow Relations ──

    /**
     * Doctors this user follows (via doctor_follows table).
     */
    public function followingDoctors()
    {
        return $this->belongsToMany(User::class, 'doctor_follows', 'follower_id', 'following_id')
            ->wherePivot('is_active', true)
            ->withTimestamps();
    }

    /**
     * Clinics this user follows (via clinic owner in doctor_follows table).
     */
    public function followingClinics()
    {
        return $this->belongsToMany(User::class, 'doctor_follows', 'follower_id', 'following_id')
            ->where('role_id', 'clinicOwner')
            ->wherePivot('is_active', true)
            ->withTimestamps();
    }

    /**
     * Users who follow this user.
     */
    public function followers()
    {
        return $this->belongsToMany(User::class, 'doctor_follows', 'following_id', 'follower_id')
            ->wherePivot('is_active', true)
            ->withTimestamps();
    }

    /**
     * Polymorphic favorites (doctors + clinics).
     */
    public function favorites()
    {
        return $this->hasMany(Favorite::class);
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

    public function isHospital(): bool
    {
        return $this->role_id === 'hospital';
    }

    public function isClinicLevel(): bool
    {
        return (int) $this->user_level === 3;
    }

    public function isHospitalLevel(): bool
    {
        return (int) $this->user_level === 4;
    }

    public function isAdminLevel(): bool
    {
        return (int) $this->user_level >= 5;
    }

    /**
     * Check if user has an active CRM subscription.
     * Admins always have access. Clinic owners check their clinic. Doctors check clinic or own flag.
     */
    public function hasCrmSubscription(): bool
    {
        if ($this->isAdmin()) return true;

        if ($this->isClinicOwner()) {
            $clinic = $this->ownedClinic ?? $this->clinic;
            return $clinic && (bool) $clinic->is_crm_active
                && (!$clinic->crm_expires_at || now()->lessThanOrEqualTo($clinic->crm_expires_at));
        }

        if ($this->isDoctor()) {
            if ($this->clinic_id && $this->clinic) {
                return (bool) $this->clinic->is_crm_active
                    && (!$this->clinic->crm_expires_at || now()->lessThanOrEqualTo($this->clinic->crm_expires_at));
            }
            return (bool) $this->is_crm_active
                && (!$this->crm_expires_at || now()->lessThanOrEqualTo($this->crm_expires_at));
        }

        if ($this->isHospital()) {
            return (bool) $this->is_crm_active
                && (!$this->crm_expires_at || now()->lessThanOrEqualTo($this->crm_expires_at));
        }

        return false;
    }
}
