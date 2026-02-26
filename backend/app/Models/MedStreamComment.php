<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MedStreamComment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'post_id', 'author_id', 'parent_id', 'content', 'is_hidden', 'is_active',
    ];

    public function parent()
    {
        return $this->belongsTo(MedStreamComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(MedStreamComment::class, 'parent_id')->where('is_hidden', false);
    }

    /**
     * Recursive: replies with their nested replies (unlimited depth).
     */
    public function allReplies()
    {
        return $this->replies()->with(['author:id,fullname,avatar', 'allReplies'])->orderBy('created_at');
    }

    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'is_active' => 'boolean',
        ];
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
