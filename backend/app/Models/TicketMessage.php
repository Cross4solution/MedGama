<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TicketMessage extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['ticket_id', 'user_id', 'body', 'attachments', 'is_internal'];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
            'is_internal' => 'boolean',
        ];
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
