<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamEngagementCounter extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['post_id', 'like_count', 'comment_count'];

    protected function casts(): array
    {
        return [
            'like_count' => 'integer',
            'comment_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function post()
    {
        return $this->belongsTo(MedStreamPost::class, 'post_id');
    }
}
