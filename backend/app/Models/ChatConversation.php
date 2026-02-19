<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatConversation extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_at',
        'last_message_content',
        'last_message_type',
        'last_message_sender_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'is_active'       => 'boolean',
        ];
    }

    // ── Scopes ──

    public function scopeForUser($query, string $userId)
    {
        return $query->where(fn ($q) =>
            $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId)
        );
    }

    // ── Relationships ──

    public function userOne()
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo()
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    public function lastMessageSender()
    {
        return $this->belongsTo(User::class, 'last_message_sender_id');
    }

    // ── Helpers ──

    /**
     * Check if a user is a participant of this conversation.
     */
    public function hasParticipant(string $userId): bool
    {
        return $this->user_one_id === $userId || $this->user_two_id === $userId;
    }

    /**
     * Get the other user's ID in this conversation.
     */
    public function otherUserId(string $userId): string
    {
        return $this->user_one_id === $userId ? $this->user_two_id : $this->user_one_id;
    }

    /**
     * Count unread messages for a given user (messages sent by the other party, not yet read).
     */
    public function unreadCountFor(string $userId): int
    {
        return $this->messages()
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Find or create a 1:1 conversation between two users.
     * Always stores the smaller UUID as user_one_id for uniqueness.
     */
    public static function findOrCreateBetween(string $userA, string $userB): self
    {
        [$one, $two] = strcmp($userA, $userB) < 0
            ? [$userA, $userB]
            : [$userB, $userA];

        return static::firstOrCreate(
            ['user_one_id' => $one, 'user_two_id' => $two],
            ['is_active' => true],
        );
    }
}
