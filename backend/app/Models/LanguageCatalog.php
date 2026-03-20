<?php

namespace App\Models;

use App\Models\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LanguageCatalog extends Model
{
    use HasFactory, HasUuids, HasTranslations;

    protected $table = 'language_catalog';
    protected $keyType = 'string';
    public $incrementing = false;

    public array $translatable = ['name'];

    protected $fillable = ['code', 'name', 'native_name', 'is_popular', 'is_active', 'display_order'];

    protected function casts(): array
    {
        return [
            'name'       => 'array',
            'is_active'  => 'boolean',
            'is_popular' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('native_name');
    }
}
