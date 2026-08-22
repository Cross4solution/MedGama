<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * Gerçek zamanlı yayını isteğin gidişatından ayırır.
 *
 * Bütün yayın olayları `ShouldBroadcastNow` — yani istek içinde, eşzamanlı
 * gönderiliyor. Yayın sunucusuna ulaşılamadığında Pusher istemcisi istisna
 * fırlatıyor ve İŞLEM BAŞARISIZ SAYILIYOR.
 *
 * Ölçüldü: yayın sunucusu kapalıyken hasta randevu oluşturduğunda uç 500
 * döndü, ama randevu veritabanına YAZILMIŞTI. Yani hasta hata görüyor,
 * muhtemelen tekrar deniyor ve mükerrer kayıt riski doğuyor. Aynı şey
 * sohbet mesajı göndermede de oluyor.
 *
 * Canlıda yayın sunucusu ayrı bir makinede: kısa bir kesinti randevu ve
 * mesajlaşmayı tamamen durdurmamalı. Yayın bir BİLDİRİM; işin kendisi değil.
 * Kaybolursa kullanıcı sayfayı yenilediğinde veriyi zaten görür.
 *
 * Neden ortak yardımcı: on çağrı noktası var ve hepsini tek tek sarmak,
 * on birincisini eklerken unutmayı davet ederdi.
 */
class Yayin
{
    /**
     * Yayını dener; başarısız olursa isteği düşürmez, günlüğe yazar.
     */
    public static function guvenli(callable $is, string $baglam = ''): void
    {
        try {
            $is();
        } catch (\Throwable $e) {
            Log::warning('Yayın gönderilemedi (işlem etkilenmedi)', [
                'baglam' => $baglam,
                'hata'   => $e->getMessage(),
            ]);
        }
    }
}
