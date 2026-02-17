<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamComment extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'post_id', 'author_id', 'content', 'is_hidden',
    ];

    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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
