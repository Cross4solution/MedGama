<?php

namespace App\Models;

use App\Models\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasUuids, HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['question', 'answer', 'category', 'sort_order', 'is_published'];

    protected function casts(): array
    {
        return [
            'question'     => 'array',
            'answer'       => 'array',
            'is_published' => 'boolean',
        ];
    }

    protected array $translatable = ['question', 'answer'];

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
