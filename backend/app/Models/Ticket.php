<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'ticket_number', 'user_id', 'category_id', 'assigned_to',
        'subject', 'status', 'priority',
        'resolved_at', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'closed_at'   => 'datetime',
        ];
    }

    // ── Relationships ──

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'category_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(TicketMessage::class)->orderByDesc('created_at')->limit(1);
    }

    // ── Scopes ──

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    // ── Helpers ──

    public static function generateTicketNumber(): string
    {
        $year = now()->format('Y');
        $last = static::withTrashed()
            ->where('ticket_number', 'like', "TKT-{$year}-%")
            ->orderByDesc('ticket_number')
            ->value('ticket_number');

        $seq = 1;
        if ($last && preg_match('/TKT-\d{4}-(\d+)/', $last, $m)) {
            $seq = ((int) $m[1]) + 1;
        }

        return sprintf('TKT-%s-%05d', $year, $seq);
    }
}
