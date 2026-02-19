<?php

namespace App\Models;

use App\Models\Scopes\VisiblePostScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedStreamPost extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected static function booted(): void
    {
        static::addGlobalScope(new VisiblePostScope);
    }

    protected $fillable = [
        'author_id', 'clinic_id', 'post_type', 'content', 'media_url', 'media',
        'is_hidden', 'is_active', 'media_processing',
    ];

    protected function casts(): array
    {
        return [
            'is_hidden'        => 'boolean',
            'is_active'        => 'boolean',
            'media_processing' => 'boolean',
            'media'            => 'array',
        ];
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
