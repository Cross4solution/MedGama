# MedGama Backend — Controller & Model Kod Referansı

**Tarih:** 19 Şubat 2026  
**Framework:** Laravel 11 (PHP 8.3)  
**Veritabanı:** PostgreSQL (UUID primary keys)  
**Auth:** Laravel Sanctum (Bearer Token)

---

# BÖLÜM 1: MODELS

---

## 1.1 User Model

**Dosya:** `app/Models/User.php`

```php
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
        'city_id', 'country_id', 'country', 'preferred_language',
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

    public function doctorProfile()
    {
        return $this->hasOne(DoctorProfile::class);
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
```

---

## 1.2 DoctorProfile Model

**Dosya:** `app/Models/DoctorProfile.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorProfile extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'title',
        'specialty',
        'sub_specialties',
        'bio',
        'experience_years',
        'license_number',
        'education',
        'certifications',
        'services',
        'prices',
        'languages',
        'address',
        'map_coordinates',
        'phone',
        'website',
        'gallery',
        'online_consultation',
        'accepts_insurance',
        'insurance_providers',
        'onboarding_completed',
        'onboarding_step',
    ];

    protected function casts(): array
    {
        return [
            'sub_specialties'    => 'array',
            'education'          => 'array',
            'certifications'     => 'array',
            'services'           => 'array',
            'prices'             => 'array',
            'languages'          => 'array',
            'map_coordinates'    => 'array',
            'gallery'            => 'array',
            'insurance_providers'=> 'array',
            'online_consultation'=> 'boolean',
            'accepts_insurance'  => 'boolean',
            'onboarding_completed' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## 1.3 Clinic Model

**Dosya:** `app/Models/Clinic.php`

```php
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
```

---

## 1.4 Appointment Model

**Dosya:** `app/Models/Appointment.php`

```php
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
```

---

## 1.5 CalendarSlot Model

**Dosya:** `app/Models/CalendarSlot.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalendarSlot extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'doctor_id', 'clinic_id', 'slot_date', 'start_time',
        'duration_minutes', 'is_available',
    ];

    protected function casts(): array
    {
        return [
            'slot_date' => 'date',
            'is_available' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function appointment()
    {
        return $this->hasOne(Appointment::class, 'slot_id');
    }
}
```

---

## 1.6 MedStreamPost Model

**Dosya:** `app/Models/MedStreamPost.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamPost extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'author_id', 'clinic_id', 'post_type', 'content', 'media_url', 'media', 'is_hidden',
    ];

    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'is_active' => 'boolean',
            'media'     => 'array',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_hidden', false)->where('is_active', true);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function comments()
    {
        return $this->hasMany(MedStreamComment::class, 'post_id');
    }

    public function likes()
    {
        return $this->hasMany(MedStreamLike::class, 'post_id');
    }

    public function reports()
    {
        return $this->hasMany(MedStreamReport::class, 'post_id');
    }

    public function engagementCounter()
    {
        return $this->hasOne(MedStreamEngagementCounter::class, 'post_id');
    }
}
```

---

## 1.7 MedStreamComment Model

**Dosya:** `app/Models/MedStreamComment.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamComment extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'post_id', 'author_id', 'parent_id', 'content', 'is_hidden',
    ];

    public function parent()
    {
        return $this->belongsTo(MedStreamComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(MedStreamComment::class, 'parent_id')->active()->where('is_hidden', false);
    }

    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function post()
    {
        return $this->belongsTo(MedStreamPost::class, 'post_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
```

---

## 1.8 MedStreamLike Model

**Dosya:** `app/Models/MedStreamLike.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamLike extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['post_id', 'user_id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function post()
    {
        return $this->belongsTo(MedStreamPost::class, 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## 1.9 MedStreamBookmark Model

**Dosya:** `app/Models/MedStreamBookmark.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamBookmark extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['user_id', 'bookmarked_type', 'target_id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## 1.10 MedStreamReport Model

**Dosya:** `app/Models/MedStreamReport.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamReport extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['post_id', 'reporter_id', 'reason', 'admin_status'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function post()
    {
        return $this->belongsTo(MedStreamPost::class, 'post_id');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
```

---

## 1.11 MedStreamEngagementCounter Model

**Dosya:** `app/Models/MedStreamEngagementCounter.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamEngagementCounter extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['post_id', 'like_count', 'comment_count'];

    protected function casts(): array
    {
        return [
            'like_count' => 'integer',
            'comment_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function post()
    {
        return $this->belongsTo(MedStreamPost::class, 'post_id');
    }
}
```

---

## 1.12 Conversation Model

**Dosya:** `app/Models/Conversation.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'title',
        'type',
        'clinic_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForUser($query, string $userId)
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId)->where('is_active', true);
        });
    }

    public function participants()
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function activeParticipants()
    {
        return $this->hasMany(ConversationParticipant::class)->where('is_active', true);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['role', 'last_read_at', 'is_muted', 'is_archived', 'is_active'])
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->limit(1);
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function otherParticipant(string $userId)
    {
        return $this->activeParticipants()->where('user_id', '!=', $userId)->first();
    }

    public function unreadCountFor(string $userId): int
    {
        $participant = $this->participants()->where('user_id', $userId)->first();
        if (!$participant) return 0;

        $query = $this->messages()->where('sender_id', '!=', $userId)->where('is_active', true);
        if ($participant->last_read_at) {
            $query->where('created_at', '>', $participant->last_read_at);
        }
        return $query->count();
    }

    public static function findOrCreateDirect(string $userA, string $userB, ?string $clinicId = null): self
    {
        $existing = static::where('type', 'direct')
            ->where('is_active', true)
            ->whereHas('participants', fn($q) => $q->where('user_id', $userA)->where('is_active', true))
            ->whereHas('participants', fn($q) => $q->where('user_id', $userB)->where('is_active', true))
            ->first();

        if ($existing) return $existing;

        $conversation = static::create([
            'type' => 'direct',
            'clinic_id' => $clinicId,
        ]);

        $conversation->participants()->createMany([
            ['user_id' => $userA, 'role' => 'member'],
            ['user_id' => $userB, 'role' => 'member'],
        ]);

        return $conversation;
    }
}
```

---

## 1.13 ConversationParticipant Model

**Dosya:** `app/Models/ConversationParticipant.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConversationParticipant extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'role',
        'last_read_at',
        'is_muted',
        'is_archived',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'last_read_at' => 'datetime',
            'is_muted' => 'boolean',
            'is_archived' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## 1.14 Message Model

**Dosya:** `app/Models/Message.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'reply_to_id',
        'body',
        'type',
        'metadata',
        'is_edited',
        'edited_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_edited' => 'boolean',
            'edited_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo()
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function replies()
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }

    public function readReceipts()
    {
        return $this->hasMany(MessageReadReceipt::class);
    }

    public function isReadBy(string $userId): bool
    {
        return $this->readReceipts()->where('user_id', $userId)->exists();
    }

    public function markReadBy(string $userId): void
    {
        $this->readReceipts()->firstOrCreate(
            ['user_id' => $userId],
            ['read_at' => now()]
        );
    }
}
```

---

## 1.15 MessageAttachment Model

**Dosya:** `app/Models/MessageAttachment.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'message_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'thumb_path',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function getUrlAttribute(): string
    {
        return url('storage/' . $this->file_path);
    }

    public function getThumbUrlAttribute(): ?string
    {
        return $this->thumb_path ? url('storage/' . $this->thumb_path) : null;
    }
}
```

---

## 1.16 MessageReadReceipt Model

**Dosya:** `app/Models/MessageReadReceipt.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageReadReceipt extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'message_id',
        'user_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## 1.17 DigitalAnamnesis Model

**Dosya:** `app/Models/DigitalAnamnesis.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DigitalAnamnesis extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'digital_anamneses';

    protected $fillable = [
        'patient_id', 'doctor_id', 'clinic_id', 'answers', 'last_updated_by',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
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
}
```

---

## 1.18 PatientRecord Model

**Dosya:** `app/Models/PatientRecord.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientRecord extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id', 'clinic_id', 'doctor_id', 'file_url',
        'upload_date', 'record_type', 'description',
    ];

    protected function casts(): array
    {
        return [
            'upload_date' => 'date',
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
}
```

---

## 1.19 CrmTag Model

**Dosya:** `app/Models/CrmTag.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmTag extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'doctor_id', 'patient_id', 'clinic_id', 'tag', 'created_by',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }
}
```

---

## 1.20 CrmProcessStage Model

**Dosya:** `app/Models/CrmProcessStage.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmProcessStage extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'doctor_id', 'patient_id', 'clinic_id', 'stage', 'started_at', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }
}
```

---

## 1.21 ArchivedClinicRecord Model

**Dosya:** `app/Models/ArchivedClinicRecord.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArchivedClinicRecord extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'former_doctor_id', 'clinic_id', 'archived_patient_id',
        'record_references', 'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'record_references' => 'array',
            'archived_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function formerDoctor()
    {
        return $this->belongsTo(User::class, 'former_doctor_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function archivedPatient()
    {
        return $this->belongsTo(User::class, 'archived_patient_id');
    }
}
```

---

## 1.22 Catalog Models

### City

**Dosya:** `app/Models/City.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['code', 'country_id', 'translations'];

    protected function casts(): array
    {
        return [
            'translations' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCountry($query, int $countryId)
    {
        return $query->where('country_id', $countryId);
    }
}
```

### Specialty

**Dosya:** `app/Models/Specialty.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['code', 'display_order', 'translations'];

    protected function casts(): array
    {
        return [
            'translations' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order');
    }
}
```

### SymptomSpecialtyMapping

**Dosya:** `app/Models/SymptomSpecialtyMapping.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SymptomSpecialtyMapping extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['symptom', 'specialty_ids', 'translations'];

    protected function casts(): array
    {
        return [
            'specialty_ids' => 'array',
            'translations' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
```

### DiseaseCondition

**Dosya:** `app/Models/DiseaseCondition.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiseaseCondition extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['code', 'recommended_specialty_ids', 'translations'];

    protected function casts(): array
    {
        return [
            'recommended_specialty_ids' => 'array',
            'translations' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
```

---

# BÖLÜM 2: CONTROLLERS

---

## 2.1 AuthController

**Dosya:** `app/Http/Controllers/Api/AuthController.php`  
**Route Prefix:** `/api/auth`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use App\Mail\VerificationCodeMail;
use App\Mail\PasswordResetMail;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'fullname' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'role_id' => 'sometimes|in:patient,doctor,clinicOwner',
            'city_id' => 'sometimes|integer',
            'country_id' => 'sometimes|integer',
            'date_of_birth' => 'sometimes|date',
            'gender' => 'sometimes|in:male,female,other',
            'clinic_id' => 'sometimes|uuid',
        ]);

        $clinicId = $validated['clinic_id'] ?? null;
        $exists = User::where('email', $validated['email'])
            ->where('clinic_id', $clinicId)
            ->where('is_active', true)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered.'],
            ]);
        }

        $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::create([
            'email' => $validated['email'],
            'password' => $validated['password'],
            'fullname' => $validated['fullname'],
            'mobile' => $validated['mobile'] ?? null,
            'role_id' => $validated['role_id'] ?? 'patient',
            'city_id' => $validated['city_id'] ?? null,
            'country_id' => $validated['country_id'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'clinic_id' => $clinicId,
            'avatar' => null,
            'email_verified' => false,
            'email_verification_code' => $verificationCode,
        ]);

        try {
            Mail::to($user->email)->send(new VerificationCodeMail($verificationCode, $user->fullname));
        } catch (\Throwable $e) {
            \Log::warning('Verification email failed: ' . $e->getMessage());
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'requires_email_verification' => true,
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'clinic_id' => 'sometimes|uuid',
        ]);

        $clinicId = $validated['clinic_id'] ?? null;

        $user = User::where('email', $validated['email'])
            ->when($clinicId, fn($q) => $q->where('clinic_id', $clinicId))
            ->where('is_active', true)
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->update(['last_login' => now()]);

        $token = $user->createToken('auth-token')->plainTextToken;

        if (!$user->email_verified) {
            return response()->json([
                'user' => $user,
                'token' => $token,
                'requires_email_verification' => true,
                'message' => 'Please verify your email address.',
            ]);
        }

        $userData = $user->toArray();
        if ($user->role_id === 'doctor') {
            $profile = $user->doctorProfile;
            $userData['onboarding_completed'] = $profile ? (bool) $profile->onboarding_completed : false;
        }

        return response()->json([
            'user' => $userData,
            'token' => $token,
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('clinic');

        $extra = [];
        if ($user->role_id === 'doctor') {
            $profile = $user->doctorProfile;
            $extra['onboarding_completed'] = $profile ? (bool) $profile->onboarding_completed : false;
        }

        return response()->json(['user' => array_merge($user->toArray(), $extra)]);
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'fullname' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|string|url',
            'mobile' => 'sometimes|string|max:20',
            'city_id' => 'sometimes|integer',
            'country_id' => 'sometimes|integer',
            'country' => 'sometimes|string|max:5',
            'preferred_language' => 'sometimes|string|max:10',
            'date_of_birth' => 'sometimes|date',
            'gender' => 'sometimes|in:male,female,other',
        ]);

        $request->user()->update($validated);
        return response()->json(['user' => $request->user()->fresh()]);
    }

    /**
     * POST /api/auth/profile/avatar
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|file|image|max:5120',
        ]);

        $file = $request->file('avatar');
        $path = $file->store('avatars', 'public');
        $url = asset('storage/' . $path);

        $request->user()->update(['avatar' => $url]);

        return response()->json([
            'avatar_url' => $url,
            'url' => $url,
            'user' => $request->user()->fresh(),
        ]);
    }

    /**
     * PUT /api/auth/profile/password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6',
            'password_confirmation' => 'required|string|same:password',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $request->password]);
        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * POST /api/auth/verify-email
     */
    public function verifyEmail(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        $user = $request->user();

        if ($user->email_verified) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->email_verification_code !== $request->code) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.'],
            ]);
        }

        $user->update([
            'email_verified' => true,
            'email_verification_code' => null,
        ]);

        return response()->json(['message' => 'Email verified successfully.', 'user' => $user->fresh()]);
    }

    /**
     * POST /api/auth/resend-verification
     */
    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update(['email_verification_code' => $code]);

        try {
            Mail::to($user->email)->send(new VerificationCodeMail($code, $user->fullname));
        } catch (\Throwable $e) {
            \Log::warning('Resend verification email failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Verification code resent.']);
    }

    /**
     * POST /api/auth/verify-mobile
     */
    public function verifyMobile(Request $request)
    {
        $request->validate(['code' => 'required|string']);
        $user = $request->user();
        $user->update(['mobile_verified' => true]);
        return response()->json(['message' => 'Mobile verified successfully.']);
    }

    /**
     * POST /api/auth/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->where('is_active', true)->first();

        if (!$user) {
            return response()->json(['message' => 'If this email exists, a reset code has been sent.']);
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'password_reset_code' => $code,
            'password_reset_expires_at' => now()->addMinutes(15),
        ]);

        try {
            Mail::to($user->email)->send(new PasswordResetMail($code, $user->fullname));
        } catch (\Throwable $e) {
            \Log::warning('Password reset email failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'If this email exists, a reset code has been sent.']);
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->where('is_active', true)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if (!$user->password_reset_code || $user->password_reset_code !== $request->code) {
            throw ValidationException::withMessages(['code' => ['Invalid reset code.']]);
        }

        if ($user->password_reset_expires_at && now()->gt($user->password_reset_expires_at)) {
            throw ValidationException::withMessages(['code' => ['Reset code has expired.']]);
        }

        $user->update([
            'password' => $request->password,
            'password_reset_code' => null,
            'password_reset_expires_at' => null,
        ]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    /**
     * DELETE /api/auth/profile — Account deletion (GDPR Art. 17)
     */
    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        $user->update([
            'is_active' => false,
            'email' => 'deleted_' . $user->id . '@removed.medgama.com',
            'fullname' => 'Deleted User',
            'avatar' => null,
            'mobile' => null,
            'mobile_verified' => false,
            'email_verified' => false,
        ]);

        $user->tokens()->delete();

        MedStreamPost::where('author_id', $user->id)->update(['is_active' => false]);
        MedStreamComment::where('author_id', $user->id)->update(['is_active' => false]);
        MedStreamLike::where('user_id', $user->id)->update(['is_active' => false]);
        MedStreamBookmark::where('user_id', $user->id)->update(['is_active' => false]);

        \Log::info('GDPR: Account deleted (soft)', ['user_id' => $user->id]);

        return response()->json(['message' => 'Account and data deleted successfully.']);
    }

    /**
     * GET /api/auth/profile/data-export — GDPR data portability (Art. 20)
     */
    public function dataExport(Request $request)
    {
        $user = $request->user();

        $export = [
            'export_date' => now()->toISOString(),
            'gdpr_export' => true,
            'user' => [
                'id' => $user->id,
                'fullname' => $user->fullname,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'role' => $user->role_id,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at,
                'last_login' => $user->last_login,
            ],
            'posts' => $user->medStreamPosts()->select('id', 'content', 'post_type', 'media_url', 'created_at')->get(),
            'comments' => MedStreamComment::where('author_id', $user->id)->select('id', 'post_id', 'content', 'created_at')->get(),
            'likes' => MedStreamLike::where('user_id', $user->id)->where('is_active', true)->select('post_id', 'created_at')->get(),
            'bookmarks' => $user->bookmarks()->where('is_active', true)->select('bookmarked_type', 'target_id', 'created_at')->get(),
            'medical_history' => json_decode($user->medical_history ?? '[]', true),
        ];

        return response()->json($export);
    }

    /**
     * GET /api/auth/profile/medical-history
     */
    public function getMedicalHistory(Request $request)
    {
        $user = $request->user();
        $conditions = json_decode($user->medical_history ?? '[]', true);
        return response()->json(['conditions' => $conditions]);
    }

    /**
     * PUT /api/auth/profile/medical-history
     */
    public function updateMedicalHistory(Request $request)
    {
        $request->validate([
            'conditions' => 'required|array',
            'conditions.*' => 'string|max:255',
        ]);

        $request->user()->update([
            'medical_history' => json_encode($request->conditions),
        ]);

        return response()->json(['message' => 'Medical history updated.', 'conditions' => $request->conditions]);
    }

    /**
     * GET /api/auth/profile/notification-preferences
     */
    public function getNotificationPrefs(Request $request)
    {
        $user = $request->user();
        $prefs = json_decode($user->notification_preferences ?? '{}', true);
        return response()->json(['preferences' => $prefs]);
    }

    /**
     * PUT /api/auth/profile/notification-preferences
     */
    public function updateNotificationPrefs(Request $request)
    {
        $request->validate([
            'email_notifications' => 'sometimes|boolean',
            'sms_notifications' => 'sometimes|boolean',
            'push_notifications' => 'sometimes|boolean',
            'appointment_reminders' => 'sometimes|boolean',
            'marketing_messages' => 'sometimes|boolean',
        ]);

        $request->user()->update([
            'notification_preferences' => json_encode($request->only([
                'email_notifications', 'sms_notifications', 'push_notifications',
                'appointment_reminders', 'marketing_messages',
            ])),
        ]);

        return response()->json(['message' => 'Notification preferences updated.']);
    }
}
```

---

## 2.2 DoctorProfileController

**Dosya:** `app/Http/Controllers/Api/DoctorProfileController.php`  
**Route Prefix:** `/api/doctor-profile`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use Illuminate\Http\Request;

class DoctorProfileController extends Controller
{
    /**
     * GET /api/doctor-profile
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $profile = DoctorProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            $profile = DoctorProfile::create([
                'user_id' => $user->id,
                'onboarding_step' => 0,
                'onboarding_completed' => false,
            ]);
        }

        return response()->json([
            'profile' => $profile,
            'user' => [
                'id' => $user->id,
                'fullname' => $user->fullname,
                'avatar' => $user->avatar,
                'email' => $user->email,
                'role_id' => $user->role_id,
            ],
        ]);
    }

    /**
     * PUT /api/doctor-profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $validated = $request->validate([
            'title'              => 'nullable|string|max:255',
            'specialty'          => 'nullable|string|max:255',
            'sub_specialties'    => 'nullable|array',
            'bio'                => 'nullable|string|max:5000',
            'experience_years'   => 'nullable|string|max:50',
            'license_number'     => 'nullable|string|max:100',
            'education'          => 'nullable|array',
            'education.*.degree' => 'required_with:education|string',
            'education.*.school' => 'required_with:education|string',
            'education.*.year'   => 'nullable|string',
            'certifications'       => 'nullable|array',
            'certifications.*.name'   => 'required_with:certifications|string',
            'certifications.*.issuer' => 'nullable|string',
            'certifications.*.year'   => 'nullable|string',
            'services'             => 'nullable|array',
            'services.*.name'        => 'required_with:services|string',
            'services.*.description' => 'nullable|string',
            'prices'               => 'nullable|array',
            'prices.*.label'       => 'required_with:prices|string',
            'prices.*.min'         => 'nullable|numeric',
            'prices.*.max'         => 'nullable|numeric',
            'prices.*.currency'    => 'nullable|string|max:10',
            'languages'          => 'nullable|array',
            'address'            => 'nullable|string|max:500',
            'map_coordinates'    => 'nullable|array',
            'phone'              => 'nullable|string|max:50',
            'website'            => 'nullable|string|max:255',
            'gallery'            => 'nullable|array',
            'online_consultation'  => 'nullable|boolean',
            'accepts_insurance'    => 'nullable|boolean',
            'insurance_providers'  => 'nullable|array',
            'onboarding_step'      => 'nullable|integer|min:0|max:10',
            'onboarding_completed' => 'nullable|boolean',
        ]);

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $profile->update($validated);

        return response()->json([
            'profile' => $profile->fresh(),
            'message' => 'Profile updated successfully',
        ]);
    }

    /**
     * PUT /api/doctor-profile/onboarding
     */
    public function updateOnboarding(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $step = $request->input('step', $profile->onboarding_step);
        $data = $request->except(['step']);

        $profile->fill($data);
        $profile->onboarding_step = max($profile->onboarding_step, $step + 1);

        if ($step >= 3) {
            $profile->onboarding_completed = true;
        }

        $profile->save();

        return response()->json([
            'profile' => $profile->fresh(),
            'message' => 'Onboarding step saved',
        ]);
    }

    /**
     * POST /api/doctor-profile/gallery
     */
    public function uploadGallery(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role_id, ['doctor', 'clinicOwner', 'superAdmin'])) {
            return response()->json(['message' => 'Not a doctor'], 403);
        }

        $request->validate([
            'images'   => 'required|array|max:10',
            'images.*' => 'file|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $profile = DoctorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['onboarding_step' => 0, 'onboarding_completed' => false]
        );

        $gallery = $profile->gallery ?? [];

        foreach ($request->file('images') as $image) {
            $path = $image->store('doctor-gallery/' . $user->id, 'public');
            $gallery[] = '/storage/' . $path;
        }

        $profile->update(['gallery' => $gallery]);

        return response()->json([
            'gallery' => $gallery,
            'message' => 'Gallery updated',
        ]);
    }
}
```

---

## 2.3 DoctorController

**Dosya:** `app/Http/Controllers/Api/DoctorController.php`  
**Route Prefix:** `/api/doctors`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    /**
     * GET /api/doctors
     */
    public function index(Request $request)
    {
        $query = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->with(['doctorProfile:id,user_id,title,specialty,experience_years,address,online_consultation,bio'])
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified');

        $query->when($request->clinic_id, fn($q, $v) => $q->where('clinic_id', $v))
              ->when($request->city_id, fn($q, $v) => $q->where('city_id', $v))
              ->when($request->search, fn($q, $v) => $q->where('fullname', 'like', "%{$v}%"))
              ->when($request->specialty, fn($q, $v) => $q->whereHas('doctorProfile', fn($pq) => $pq->where('specialty', 'ilike', "%{$v}%")));

        $doctors = $query->orderBy('fullname')->paginate($request->per_page ?? 50);

        return response()->json($doctors);
    }

    /**
     * GET /api/doctors/{id}
     */
    public function show(string $id)
    {
        $doctor = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->with(['doctorProfile', 'clinic:id,name,codename,avatar,address'])
            ->select('id', 'fullname', 'avatar', 'email', 'city_id', 'country_id', 'clinic_id', 'is_verified', 'gender')
            ->findOrFail($id);

        return response()->json(['doctor' => $doctor]);
    }
}
```

---

## 2.4 ClinicController

**Dosya:** `app/Http/Controllers/Api/ClinicController.php`  
**Route Prefix:** `/api/clinics`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClinicController extends Controller
{
    public function index(Request $request)
    {
        $clinics = Clinic::active()
            ->when($request->name, fn($q, $v) => $q->where('fullname', 'like', "%{$v}%"))
            ->select('id', 'name', 'codename', 'fullname', 'avatar', 'address', 'is_verified')
            ->paginate($request->per_page ?? 20);

        return response()->json($clinics);
    }

    public function show(string $codename)
    {
        $clinic = Clinic::active()->where('codename', $codename)->firstOrFail();
        return response()->json(['clinic' => $clinic->load('owner:id,fullname,avatar')]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'fullname' => 'required|string|max:255',
            'owner_id' => 'required|uuid|exists:users,id',
            'address' => 'sometimes|string',
            'biography' => 'sometimes|string',
            'map_coordinates' => 'sometimes|array',
            'website' => 'sometimes|url',
        ]);

        $validated['codename'] = Str::slug($validated['name']) . '-' . Str::random(4);
        $validated['avatar'] = 'https://gravatar.com/avatar/' . md5(strtolower($validated['fullname'])) . '?s=200&d=identicon';

        $clinic = Clinic::create($validated);

        User::where('id', $validated['owner_id'])->update([
            'role_id' => 'clinicOwner',
            'clinic_id' => $clinic->id,
        ]);

        return response()->json(['clinic' => $clinic], 201);
    }

    public function update(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);
        $user = $request->user();

        if ($clinic->owner_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'fullname' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|string|url',
            'address' => 'sometimes|string',
            'biography' => 'sometimes|string',
            'map_coordinates' => 'sometimes|array',
            'website' => 'sometimes|url',
        ]);

        $clinic->update($validated);
        return response()->json(['clinic' => $clinic->fresh()]);
    }

    public function staff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);

        $staff = User::active()
            ->where('clinic_id', $clinic->id)
            ->with('doctorProfile:id,user_id,title,specialty,experience_years,onboarding_completed')
            ->select('id', 'fullname', 'email', 'avatar', 'role_id', 'is_verified', 'clinic_id', 'created_at')
            ->paginate($request->per_page ?? 50);

        return response()->json($staff);
    }

    public function createStaff(Request $request, string $id)
    {
        $clinic = Clinic::active()->findOrFail($id);
        $user = $request->user();

        if ($clinic->owner_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'fullname'  => 'required|string|max:255',
            'email'     => 'required|email|max:255',
            'password'  => 'required|string|min:6|max:100',
            'mobile'    => 'nullable|string|max:20',
            'title'     => 'nullable|string|max:255',
            'specialty' => 'nullable|string|max:255',
            'bio'       => 'nullable|string|max:5000',
            'experience_years' => 'nullable|string|max:50',
        ]);

        $exists = User::where('email', $validated['email'])->where('clinic_id', $clinic->id)->exists();
        if ($exists) {
            return response()->json(['message' => 'A user with this email already exists in this clinic.'], 422);
        }

        $doctor = User::create([
            'fullname'       => $validated['fullname'],
            'email'          => $validated['email'],
            'password'       => bcrypt($validated['password']),
            'mobile'         => $validated['mobile'] ?? null,
            'role_id'        => 'doctor',
            'clinic_id'      => $clinic->id,
            'is_active'      => true,
            'email_verified' => true,
        ]);

        $profileFields = array_filter([
            'title'            => $validated['title'] ?? null,
            'specialty'        => $validated['specialty'] ?? null,
            'bio'              => $validated['bio'] ?? null,
            'experience_years' => $validated['experience_years'] ?? null,
        ]);

        if (!empty($profileFields)) {
            $doctor->doctorProfile()->create(array_merge($profileFields, [
                'onboarding_completed' => false,
                'onboarding_step'      => 0,
            ]));
        }

        return response()->json([
            'doctor'  => $doctor->load('doctorProfile'),
            'message' => 'Doctor account created successfully.',
        ], 201);
    }
}
```

---

## 2.5 — 2.14 Diğer Controller'lar

> Dosya çok uzun olduğu için kalan controller'lar (AppointmentController, CalendarSlotController, MedStreamController, MessageController, NotificationController, CatalogController, CrmController, DigitalAnamnesisController, PatientRecordController, MediaStreamController) ayrı bir dokümanda devam eder.

---

# BÖLÜM 3: ROUTES

**Dosya:** `routes/api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\PatientRecordController;
use App\Http\Controllers\Api\DigitalAnamnesisController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\MedStreamController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\DoctorProfileController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MediaStreamController;

// ── Auth (Public) ──
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// ── Auth (Protected) ──
Route::prefix('auth')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);
    Route::delete('/profile', [AuthController::class, 'deleteAccount']);
    Route::get('/profile/data-export', [AuthController::class, 'dataExport']);
    Route::get('/profile/medical-history', [AuthController::class, 'getMedicalHistory']);
    Route::put('/profile/medical-history', [AuthController::class, 'updateMedicalHistory']);
    Route::get('/profile/notification-preferences', [AuthController::class, 'getNotificationPrefs']);
    Route::put('/profile/notification-preferences', [AuthController::class, 'updateNotificationPrefs']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    Route::post('/verify-mobile', [AuthController::class, 'verifyMobile']);
});

// ── Catalog (Public read) ──
Route::prefix('catalog')->group(function () {
    Route::get('/specialties', [CatalogController::class, 'specialties']);
    Route::get('/cities', [CatalogController::class, 'cities']);
    Route::get('/diseases', [CatalogController::class, 'diseases']);
    Route::get('/symptoms', [CatalogController::class, 'symptoms']);
});

// ── Catalog (Admin write) ──
Route::prefix('catalog')->middleware(['auth:sanctum', 'role:superAdmin,saasAdmin'])->group(function () {
    Route::post('/specialties', [CatalogController::class, 'storeSpecialty']);
    Route::put('/specialties/{id}', [CatalogController::class, 'updateSpecialty']);
    Route::delete('/specialties/{id}', [CatalogController::class, 'destroySpecialty']);
    Route::post('/cities', [CatalogController::class, 'storeCity']);
    Route::put('/cities/{id}', [CatalogController::class, 'updateCity']);
    Route::delete('/cities/{id}', [CatalogController::class, 'destroyCity']);
    Route::post('/diseases', [CatalogController::class, 'storeDisease']);
    Route::put('/diseases/{id}', [CatalogController::class, 'updateDisease']);
    Route::post('/symptoms', [CatalogController::class, 'storeSymptom']);
    Route::put('/symptoms/{id}', [CatalogController::class, 'updateSymptom']);
});

// ── Clinics ──
Route::get('/clinics', [ClinicController::class, 'index']);
Route::get('/clinics/{codename}', [ClinicController::class, 'show']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/clinics', [ClinicController::class, 'store'])->middleware('role:superAdmin,saasAdmin');
    Route::put('/clinics/{id}', [ClinicController::class, 'update']);
    Route::get('/clinics/{id}/staff', [ClinicController::class, 'staff']);
    Route::post('/clinics/{id}/staff', [ClinicController::class, 'createStaff']);
});

// ── Doctors (Public) ──
Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);

// ── Doctor Profile (Protected) ──
Route::prefix('doctor-profile')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [DoctorProfileController::class, 'show']);
    Route::put('/', [DoctorProfileController::class, 'update']);
    Route::put('/onboarding', [DoctorProfileController::class, 'updateOnboarding']);
    Route::post('/gallery', [DoctorProfileController::class, 'uploadGallery']);
});

// ── Appointments (Protected) ──
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('appointments', AppointmentController::class);
});

// ── Calendar Slots (Protected) ──
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/calendar-slots', [CalendarSlotController::class, 'index']);
    Route::post('/calendar-slots', [CalendarSlotController::class, 'store'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::post('/calendar-slots/bulk', [CalendarSlotController::class, 'bulkStore'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::put('/calendar-slots/{id}', [CalendarSlotController::class, 'update'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::delete('/calendar-slots/{id}', [CalendarSlotController::class, 'destroy'])->middleware('role:doctor,clinicOwner,superAdmin');
});

// ── Patient Records (Protected) ──
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/patient-records', [PatientRecordController::class, 'index']);
    Route::get('/patient-records/{id}', [PatientRecordController::class, 'show']);
    Route::post('/patient-records', [PatientRecordController::class, 'store'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::delete('/patient-records/{id}', [PatientRecordController::class, 'destroy'])->middleware('role:doctor,clinicOwner,superAdmin');
});

// ── Digital Anamnesis (Protected) ──
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/anamnesis/{patientId}', [DigitalAnamnesisController::class, 'show']);
    Route::post('/anamnesis', [DigitalAnamnesisController::class, 'upsert']);
});

// ── CRM (Protected — doctor/clinicOwner) ──
Route::prefix('crm')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,superAdmin'])->group(function () {
    Route::get('/tags', [CrmController::class, 'tags']);
    Route::post('/tags', [CrmController::class, 'storeTag']);
    Route::delete('/tags/{id}', [CrmController::class, 'destroyTag']);
    Route::get('/stages', [CrmController::class, 'stages']);
    Route::post('/stages', [CrmController::class, 'storeStage']);
    Route::put('/stages/{id}', [CrmController::class, 'updateStage']);
    Route::get('/archived-records', [CrmController::class, 'archivedRecords']);
    Route::post('/archived-records', [CrmController::class, 'storeArchivedRecord']);
});

// ── MedStream ──
Route::prefix('medstream')->group(function () {
    Route::get('/posts', [MedStreamController::class, 'posts']);
    Route::get('/posts/{id}', [MedStreamController::class, 'showPost']);
    Route::get('/posts/{postId}/comments', [MedStreamController::class, 'comments']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/posts', [MedStreamController::class, 'storePost']);
        Route::put('/posts/{id}', [MedStreamController::class, 'updatePost']);
        Route::delete('/posts/{id}', [MedStreamController::class, 'destroyPost']);
        Route::post('/posts/{postId}/comments', [MedStreamController::class, 'storeComment']);
        Route::post('/posts/{postId}/like', [MedStreamController::class, 'toggleLike']);
        Route::post('/posts/{postId}/report', [MedStreamController::class, 'storeReport']);
        Route::get('/bookmarks', [MedStreamController::class, 'bookmarks']);
        Route::post('/bookmarks', [MedStreamController::class, 'toggleBookmark']);
    });

    Route::middleware(['auth:sanctum', 'role:superAdmin,saasAdmin'])->group(function () {
        Route::get('/reports', [MedStreamController::class, 'reports']);
        Route::put('/reports/{id}', [MedStreamController::class, 'updateReport']);
    });
});

// ── Messaging ──
Route::prefix('messages')->middleware('auth:sanctum')->group(function () {
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::post('/conversations', [MessageController::class, 'createConversation']);
    Route::get('/conversations/{id}', [MessageController::class, 'showConversation']);
    Route::put('/conversations/{id}', [MessageController::class, 'updateConversation']);
    Route::delete('/conversations/{id}', [MessageController::class, 'deleteConversation']);
    Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'messages']);
    Route::post('/conversations/{conversationId}/messages', [MessageController::class, 'sendMessage']);
    Route::post('/conversations/{conversationId}/read', [MessageController::class, 'markRead']);
    Route::put('/{messageId}', [MessageController::class, 'updateMessage']);
    Route::delete('/{messageId}', [MessageController::class, 'deleteMessage']);
    Route::get('/search', [MessageController::class, 'search']);
    Route::get('/unread-count', [MessageController::class, 'unreadCount']);
});

// ── Notifications ──
Route::prefix('notifications')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/', [NotificationController::class, 'destroyAll']);
});

// ── Media Stream (Public — video seek support) ──
Route::get('/media/stream/{path}', [MediaStreamController::class, 'stream'])
    ->where('path', '.*');
```

---

*Bu doküman MedGama backend kaynak kodunun referans kopyasıdır.*
*Oluşturulma tarihi: 19 Şubat 2026*
