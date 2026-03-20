<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['user_id', 'favoritable_id', 'favoritable_type'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic: resolve to Doctor (User) or Clinic.
     */
    public function favoritable()
    {
        return $this->morphTo();
    }

    // ── Scopes ──

    public function scopeOfType($query, string $type)
    {
        return $query->where('favoritable_type', $type);
    }

    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }
}
