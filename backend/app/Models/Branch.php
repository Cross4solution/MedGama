<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'hospital_id',
        'name',
        'address',
        'city',
        'country',
        'latitude',
        'longitude',
        'phone',
        'email',
        'is_active',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'latitude'      => 'decimal:7',
            'longitude'     => 'decimal:7',
            'is_active'     => 'boolean',
            'display_order' => 'integer',
        ];
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relationships ──

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }
}
