<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'created_by',
        'title',
        'body',
        'type',
        'target_roles',
        'is_active',
        'is_dismissible',
        'starts_at',
        'ends_at',
        'link_url',
        'link_label',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'target_roles'   => 'array',
            'is_active'      => 'boolean',
            'is_dismissible' => 'boolean',
            'starts_at'      => 'datetime',
            'ends_at'        => 'datetime',
            'priority'       => 'integer',
        ];
    }

    // ── Relationships ──

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCurrentlyVisible($query)
    {
        $now = now();
        return $query->active()
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            });
    }

    public function scopeForRole($query, ?string $role)
    {
        if (!$role) return $query;

        return $query->where(function ($q) use ($role) {
            $q->whereJsonLength('target_roles', 0)
              ->orWhereJsonContains('target_roles', $role);
        });
    }
}
