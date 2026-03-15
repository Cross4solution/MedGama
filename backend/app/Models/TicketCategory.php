<?php

namespace App\Models;

use App\Models\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TicketCategory extends Model
{
    use HasUuids, HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['name', 'description', 'slug', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return [
            'name'        => 'array',
            'description' => 'array',
            'is_active'   => 'boolean',
        ];
    }

    protected array $translatable = ['name', 'description'];

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'category_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
