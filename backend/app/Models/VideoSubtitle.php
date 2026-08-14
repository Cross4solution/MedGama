<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Bir videonun bir dildeki alt yazısı.
 *
 * Doktor düzelttiyse (`edited`) otomatik üretim bu satırın üzerine yazmaz:
 * ilaç ve hastalık adlarında sesten yazıya çevirme sık yanılır, düzeltilmiş
 * bir metnin makine tarafından geri bozulması kabul edilemez.
 */
class VideoSubtitle extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    public const BEKLIYOR = 'pending';
    public const HAZIR    = 'ready';
    public const HATA     = 'failed';

    protected $fillable = [
        'post_id', 'media_index', 'language', 'kind', 'status',
        'segments', 'edited', 'edited_by', 'edited_at', 'engine', 'error',
    ];

    protected function casts(): array
    {
        return [
            'segments'    => 'array',
            'edited'      => 'boolean',
            'edited_at'   => 'datetime',
            'media_index' => 'integer',
        ];
    }

    public function post()
    {
        return $this->belongsTo(MedStreamPost::class, 'post_id');
    }

    public function hazirMi(): bool
    {
        return $this->status === self::HAZIR && !empty($this->segments);
    }

    /** Alt yazıyı oynatıcıların anladığı WebVTT biçimine çevirir. */
    public function toVtt(): string
    {
        $satirlar = ["WEBVTT", ""];

        foreach ($this->segments ?? [] as $p) {
            $bas = self::zaman($p['start'] ?? 0);
            $son = self::zaman($p['end'] ?? 0);
            $satirlar[] = "{$bas} --> {$son}";
            $satirlar[] = trim($p['text'] ?? '');
            $satirlar[] = '';
        }

        return implode("\n", $satirlar);
    }

    /** Saniye → 00:00:00.000 */
    private static function zaman(float|int $saniye): string
    {
        $ms = (int) round(($saniye - floor($saniye)) * 1000);
        $s  = (int) floor($saniye);

        return sprintf('%02d:%02d:%02d.%03d', intdiv($s, 3600), intdiv($s % 3600, 60), $s % 60, $ms);
    }

    /** Çeviri için düz metin listesi (zaman bilgisi ayrı tutulur). */
    public function metinler(): array
    {
        return array_map(fn ($p) => $p['text'] ?? '', $this->segments ?? []);
    }
}
