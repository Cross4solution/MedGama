<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class HealthDataAuditLog extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'accessor_id',
        'patient_id',
        'resource_type',
        'resource_id',
        'action',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function accessor()
    {
        return $this->belongsTo(User::class, 'accessor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    // ── Static Helper ──

    /**
     * Record a health data access event.
     */
    public static function log(
        string $accessorId,
        string $patientId,
        string $resourceType,
        ?string $resourceId = null,
        string $action = 'view',
    ): self {
        return static::create([
            'accessor_id'   => $accessorId,
            'patient_id'    => $patientId,
            'resource_type' => $resourceType,
            'resource_id'   => $resourceId,
            'action'        => $action,
            'ip_address'    => request()?->ip(),
            'user_agent'    => request()?->userAgent(),
            'created_at'    => now(),
        ]);
    }
}
