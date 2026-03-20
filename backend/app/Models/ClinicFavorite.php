<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ClinicFavorite extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['user_id', 'clinic_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }
}
