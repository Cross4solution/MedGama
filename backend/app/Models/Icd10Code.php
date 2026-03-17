<?php

namespace App\Models;

use App\Models\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Icd10Code extends Model
{
    use HasUuids, HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    public array $translatable = ['name'];

    protected $fillable = ['code', 'category', 'name', 'is_active'];

    protected function casts(): array
    {
        return [
            'name'      => 'array',
            'is_active' => 'boolean',
        ];
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Search ICD-10 codes by code prefix or name (TR/EN).
     */
    public function scopeSearch($query, string $term)
    {
        $term = mb_strtolower(trim($term));

        return $query->where(function ($q) use ($term) {
            $q->whereRaw('LOWER(code) LIKE ?', ["{$term}%"])
              ->orWhereRaw("LOWER(name->>'en') LIKE ?", ["%{$term}%"])
              ->orWhereRaw("LOWER(name->>'tr') LIKE ?", ["%{$term}%"]);
        });
    }
}
