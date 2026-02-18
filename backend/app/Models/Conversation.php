<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'title',
        'type',
        'clinic_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: conversations where the given user is a participant.
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId)->where('is_active', true);
        });
    }

    // ── Relationships ──

    public function participants()
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function activeParticipants()
    {
        return $this->hasMany(ConversationParticipant::class)->where('is_active', true);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['role', 'last_read_at', 'is_muted', 'is_archived', 'is_active'])
            ->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    // ── Helpers ──

    /**
     * Get the other participant in a direct conversation.
     */
    public function otherParticipant(string $userId)
    {
        return $this->activeParticipants()->where('user_id', '!=', $userId)->first();
    }

    /**
     * Count unread messages for a given user.
     */
    public function unreadCountFor(string $userId): int
    {
        $participant = $this->participants()->where('user_id', $userId)->first();
        if (!$participant) return 0;

        $query = $this->messages()->where('sender_id', '!=', $userId)->where('is_active', true);
        if ($participant->last_read_at) {
            $query->where('created_at', '>', $participant->last_read_at);
        }
        return $query->count();
    }

    /**
     * Find or create a direct conversation between two users.
     */
    public static function findOrCreateDirect(string $userA, string $userB, ?string $clinicId = null): self
    {
        // Look for existing direct conversation between these two users
        $existing = static::where('type', 'direct')
            ->where('is_active', true)
            ->whereHas('participants', fn($q) => $q->where('user_id', $userA)->where('is_active', true))
            ->whereHas('participants', fn($q) => $q->where('user_id', $userB)->where('is_active', true))
            ->first();

        if ($existing) return $existing;

        // Create new direct conversation
        $conversation = static::create([
            'type' => 'direct',
            'clinic_id' => $clinicId,
        ]);

        $conversation->participants()->createMany([
            ['user_id' => $userA, 'role' => 'member'],
            ['user_id' => $userB, 'role' => 'member'],
        ]);

        return $conversation;
    }
}
