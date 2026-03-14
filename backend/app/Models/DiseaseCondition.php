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

    protected $fillable = ['code', 'name', 'description', 'recommended_specialty_ids'];

    protected function casts(): array
    {
        return [
            'name'                     => 'array',
            'description'              => 'array',
            'recommended_specialty_ids' => 'array',
            'is_active'                => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
