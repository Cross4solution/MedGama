<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'description',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ── Static Helper ──

    /**
     * Record an audit event.
     */
    public static function log(
        string $action,
        string $resourceType,
        ?string $resourceId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
    ): self {
        return static::create([
            'user_id'       => auth()->id(),
            'action'        => $action,
            'resource_type' => $resourceType,
            'resource_id'   => $resourceId,
            'old_values'    => $oldValues,
            'new_values'    => $newValues,
            'ip_address'    => request()?->ip(),
            'user_agent'    => request()?->userAgent(),
            'description'   => $description,
            'created_at'    => now(),
        ]);
    }
}
