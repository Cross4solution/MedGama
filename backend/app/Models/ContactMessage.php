<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'receiver_type',
        'subject',
        'body',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'is_read'  => 'boolean',
            'read_at'  => 'datetime',
        ];
    }

    // ── Relationships ──

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments()
    {
        return $this->hasMany(ContactMessageAttachment::class);
    }

    /**
     * Polymorphic receiver (clinic or doctor/user).
     */
    public function receiver()
    {
        if ($this->receiver_type === 'clinic') {
            return $this->belongsTo(Clinic::class, 'receiver_id');
        }
        return $this->belongsTo(User::class, 'receiver_id');
    }

    // ── Scopes ──

    public function scopeForReceiver($query, string $receiverId, string $receiverType)
    {
        return $query->where('receiver_id', $receiverId)->where('receiver_type', $receiverType);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}
