<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'reply_to_id',
        'body',
        'type',
        'metadata',
        'is_edited',
        'edited_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_edited' => 'boolean',
            'edited_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Relationships ──

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo()
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function replies()
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }

    public function readReceipts()
    {
        return $this->hasMany(MessageReadReceipt::class);
    }

    // ── Helpers ──

    public function isReadBy(string $userId): bool
    {
        return $this->readReceipts()->where('user_id', $userId)->exists();
    }

    public function markReadBy(string $userId): void
    {
        $this->readReceipts()->firstOrCreate(
            ['user_id' => $userId],
            ['read_at' => now()]
        );
    }
}
