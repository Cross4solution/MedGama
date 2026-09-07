<?php

namespace App\Support;

/**
 * Fiyat kalemlerinden "en düşük fiyat + para birimi".
 *
 * Doktor profili (`prices`: {label, min, max, currency}) ve klinik
 * (`price_ranges`: {service, min, max, currency}) aynı kuralı paylaşır:
 * kalemde `min` yoksa `max`, ikisi de yoksa kalem sayılmaz. Para birimi
 * simge (₺ € $ £) ya da kod (TRY EUR USD GBP) olarak gelebilir; koda
 * çevrilir, yazılmamışsa TRY sayılır.
 *
 * Sonuç TEK para birimindedir: en ucuz kalemin birimi. Farklı birimlerde
 * kalemleri olan bir profil yalnız o birimin süzgecinde görünür. Karışık
 * birimleri tek sayıya indirmek kur gerektirir; bilerek yapılmıyor.
 */
final class Fiyat
{
    private const BIRIMLER = [
        '₺' => 'TRY', 'TL' => 'TRY', 'TRY' => 'TRY',
        '€' => 'EUR', 'EUR' => 'EUR',
        '$' => 'USD', 'USD' => 'USD',
        '£' => 'GBP', 'GBP' => 'GBP',
    ];

    public const DESTEKLENEN = ['TRY', 'EUR', 'USD', 'GBP'];

    public static function birim(mixed $ham): string
    {
        $anahtar = strtoupper(trim((string) $ham));
        return self::BIRIMLER[$anahtar] ?? (in_array($anahtar, self::DESTEKLENEN, true) ? $anahtar : 'TRY');
    }

    /** @return array{min: ?float, currency: ?string} */
    public static function asgari(mixed $kalemler): array
    {
        $enDusuk = null;
        $birim = null;
        foreach ((array) $kalemler as $kalem) {
            if (!is_array($kalem)) continue;
            $deger = $kalem['min'] ?? $kalem['max'] ?? null;
            if ($deger === null || $deger === '' || !is_numeric($deger)) continue;
            $deger = (float) $deger;
            if ($enDusuk === null || $deger < $enDusuk) {
                $enDusuk = $deger;
                $birim = self::birim($kalem['currency'] ?? '');
            }
        }
        return ['min' => $enDusuk, 'currency' => $enDusuk === null ? null : $birim];
    }
}
