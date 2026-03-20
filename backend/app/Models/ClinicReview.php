<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

class ClinicReview extends Model
{
    use HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected static string $auditResourceLabel = 'ClinicReview';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'clinic_id',
        'patient_id',
        'appointment_id',
        'rating',
        'comment',
        'treatment_type',
        'clinic_response',
        'clinic_response_at',
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
            'clinic_response_at'  => 'datetime',
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

    // ── Relationships ──

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
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
     * Recalculate and persist aggregated rating on the clinic.
     */
    public static function recalculateAggregatedRating(string $clinicId): void
    {
        $stats = static::where('clinic_id', $clinicId)
            ->where('is_visible', true)
            ->where('moderation_status', 'approved')
            ->selectRaw('COUNT(*) as cnt, ROUND(AVG(rating)::numeric, 1) as avg')
            ->first();

        Clinic::where('id', $clinicId)->update([
            'avg_rating'   => $stats->avg ?? null,
            'review_count' => $stats->cnt ?? 0,
        ]);
    }
}
