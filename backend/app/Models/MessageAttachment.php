<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'message_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'thumb_path',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    // ── Helpers ──

    public function getUrlAttribute(): string
    {
        return url('storage/' . $this->file_path);
    }

    public function getThumbUrlAttribute(): ?string
    {
        return $this->thumb_path ? url('storage/' . $this->thumb_path) : null;
    }
}
