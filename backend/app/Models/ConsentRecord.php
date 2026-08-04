<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ConsentRecord extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'type', 'version', 'granted_at', 'revoked_at',
        'source', 'locale', 'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Halen yürürlükte mi? (verilmiş ve geri alınmamış) */
    public function isActive(): bool
    {
        return $this->granted_at !== null && $this->revoked_at === null;
    }

    public function scopeActive($query)
    {
        return $query->whereNotNull('granted_at')->whereNull('revoked_at');
    }
}
