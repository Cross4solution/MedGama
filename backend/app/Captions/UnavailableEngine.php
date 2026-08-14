<?php

namespace App\Captions;

use RuntimeException;

/**
 * Motor seçilmediğinde devrede olan uygulama.
 *
 * Arayüz bu durumda alt yazı düğmesini pasif gösterir. Sessizce boş metin
 * döndürmek yerine açıkça "kullanılamıyor" demesi önemli: hasta, gelmeyen
 * alt yazıyı "doktor konuşmuyor" sanmamalı.
 */
class UnavailableEngine implements TranscriptionEngine
{
    public function kullanilabilir(): bool
    {
        return false;
    }

    public function oturumAc(string $appointmentId, string $konusmaDili): array
    {
        throw new RuntimeException(
            'Alt yazı motoru yapılandırılmadı. CAPTIONS_ENGINE ayarlanana kadar alt yazı kullanılamaz.'
        );
    }

    public function dosyaCevir(string $dosyaYolu, ?string $dil = null): ?array
    {
        return null;
    }

    public function dosyaCevirisiVarMi(): bool
    {
        return false;
    }

    public function diller(): array
    {
        return [];
    }

    public function ad(): string
    {
        return 'unavailable';
    }
}
