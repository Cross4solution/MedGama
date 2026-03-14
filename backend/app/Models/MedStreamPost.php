<?php

namespace App\Models;

use App\Models\Scopes\VisiblePostScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedStreamPost extends Model
{
    use HasFactory, HasUuids, MassPrunable, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected static function booted(): void
    {
        static::addGlobalScope(new VisiblePostScope);
    }

    protected $fillable = [
        'author_id', 'clinic_id', 'hospital_id', 'specialty_id', 'post_type', 'content',
        'media_url', 'media', 'is_hidden', 'is_anonymous', 'gdpr_consent',
        'is_active', 'media_processing', 'view_count',
    ];

    protected function casts(): array
    {
        return [
            'is_hidden'        => 'boolean',
            'is_anonymous'     => 'boolean',
            'gdpr_consent'     => 'boolean',
            'is_active'        => 'boolean',
            'media_processing' => 'boolean',
            'media'            => 'array',
            'view_count'       => 'integer',
        ];
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 3 year retention after soft-delete) ──

    public function prunable()
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYears(3));
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
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
