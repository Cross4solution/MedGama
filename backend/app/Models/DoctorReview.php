<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

class DoctorReview extends Model
{
    use HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected static string $auditResourceLabel = 'DoctorReview';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'doctor_id',
        'patient_id',
        'appointment_id',
        'rating',
        'comment',
        'treatment_type',
        'doctor_response',
        'doctor_response_at',
        'is_verified',
        'is_visible',
        'moderation_status',
        'moderated_by',
        'moderated_at',
        'moderation_note',
    ];

    protected function casts(): array
    {
        return [
            'rating'              => 'integer',
            'is_verified'         => 'boolean',
            'is_visible'          => 'boolean',
            'doctor_response_at'  => 'datetime',
            'moderated_at'        => 'datetime',
        ];
    }

    // ── Scopes ──

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true)
            ->where('moderation_status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('moderation_status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('moderation_status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('moderation_status', 'rejected');
    }

    public function scopeHidden($query)
    {
        return $query->where('moderation_status', 'hidden');
    }

    // ── Relationships ──

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    // ── Helpers ──

    /**
     * Recalculate and persist aggregated rating on the doctor's profile.
     */
    public static function recalculateAggregatedRating(string $doctorId): void
    {
        $stats = static::where('doctor_id', $doctorId)
            ->where('is_visible', true)
            ->where('moderation_status', 'approved')
            ->selectRaw('COUNT(*) as cnt, ROUND(AVG(rating)::numeric, 1) as avg')
            ->first();

        DoctorProfile::where('user_id', $doctorId)->update([
            'avg_rating'   => $stats->avg ?? null,
            'review_count' => $stats->cnt ?? 0,
        ]);
    }
}
