<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorFollow extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['follower_id', 'following_id', 'following_type', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function follower()
    {
        return $this->belongsTo(User::class, 'follower_id');
    }

    public function following()
    {
        if ($this->following_type === 'clinic') {
            return $this->belongsTo(Clinic::class, 'following_id');
        }
        return $this->belongsTo(User::class, 'following_id');
    }
}
