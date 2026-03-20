<?php

namespace App\Models;

use App\Models\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiseaseCondition extends Model
{
    use HasFactory, HasUuids, HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    public array $translatable = ['name', 'description'];

    protected $fillable = ['code', 'name', 'description', 'recommended_specialty_ids', 'is_popular'];

    protected function casts(): array
    {
        return [
            'name'                     => 'array',
            'description'              => 'array',
            'recommended_specialty_ids' => 'array',
            'is_active'                => 'boolean',
            'is_popular'               => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
