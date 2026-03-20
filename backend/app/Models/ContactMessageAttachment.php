<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactMessageAttachment extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'contact_message_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    public function contactMessage()
    {
        return $this->belongsTo(ContactMessage::class);
    }
}
