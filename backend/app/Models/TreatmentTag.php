<?php

namespace App\Models;

use App\Models\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TreatmentTag extends Model
{
    use HasFactory, HasUuids, HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'specialty_id',
        'slug',
        'name',
        'aliases',
        'description',
        'is_active',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'name'        => 'array',
            'aliases'     => 'array',
            'description' => 'array',
            'is_active'   => 'boolean',
        ];
    }

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('created_at');
    }
}
