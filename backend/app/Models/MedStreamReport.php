<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedStreamReport extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['post_id', 'reporter_id', 'reason', 'admin_status'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function post()
    {
        return $this->belongsTo(MedStreamPost::class, 'post_id');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
