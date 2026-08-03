<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

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
            'file_path'  => 'encrypted',
            'thumb_path' => 'encrypted',
            'file_size'  => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    // ── Relationships ──

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    // ── Helpers ──

    /**
     * Ek dosyası artık herkese açık storage URL'inden servis EDİLMEZ.
     * Sohbete sağlık belgesi gelebildiği için dosyalar private+şifreli diskte durur;
     * burada yalnız kısa süreli İMZALI bağlantı üretilir. Bu bağlantı, isteği yapan
     * kullanıcının sohbetin katılımcısı olduğu doğrulandıktan sonra (authenticated
     * API yanıtında) üretilir ve süresi dolunca geçersizleşir.
     */
    public function getUrlAttribute(): string
    {
        return URL::temporarySignedRoute(
            'messages.attachment.file',
            now()->addMinutes(30),
            ['attachment' => $this->id]
        );
    }

    public function getThumbUrlAttribute(): ?string
    {
        if (!$this->thumb_path) {
            return null;
        }

        return URL::temporarySignedRoute(
            'messages.attachment.thumb',
            now()->addMinutes(30),
            ['attachment' => $this->id]
        );
    }
}
