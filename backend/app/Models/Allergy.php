<?php

namespace App\Models;

use App\Models\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allergy extends Model
{
    use HasFactory, HasUuids, HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    public array $translatable = ['name'];

    protected $fillable = ['code', 'name', 'category', 'is_active', 'is_popular'];

    protected function casts(): array
    {
        return [
            'name'      => 'array',
            'is_active'  => 'boolean',
            'is_popular' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
