<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Bir içeriğin belirli bir dildeki çevirisi (önbellek kaydı).
 *
 * Özgün metin burada DEĞİL, kendi tablosunda durur. Bu tablo silinse hiçbir
 * içerik kaybolmaz — yalnızca çeviriler yeniden üretilir.
 */
class Translation extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'source_type', 'source_id', 'field',
        'source_lang', 'target_lang', 'source_hash', 'translated',
    ];

    protected function casts(): array
    {
        return [
            // Mesaj çevirileri de burada tutulabiliyor ve mesajlar sağlık
            // verisi olabilir; özgün metinle aynı korumada olmalı.
            'translated' => 'encrypted',
        ];
    }
}
