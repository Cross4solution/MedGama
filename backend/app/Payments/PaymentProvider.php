<?php

namespace App\Payments;

use App\Models\Payment;

/**
 * Ödeme sağlayıcısı sözleşmesi.
 *
 * Sağlayıcı henüz seçilmedi (iyzico / Stripe / PayTR). Uygulamanın geri kalanı
 * bu arayüzle konuşur; sağlayıcı belli olunca yalnızca bu arayüzü uygulayan bir
 * sınıf yazılır ve ayardan seçilir — akış, veritabanı ve arayüz değişmez.
 *
 * ÖNEMLİ: Hiçbir uygulama kart verisi ALMAZ. Hasta sağlayıcının kendi ödeme
 * sayfasına yönlendirilir; bize yalnızca bir referans döner. Kart verisi
 * sunucumuza girseydi PCI-DSS denetimine tabi olurduk.
 */
interface PaymentProvider
{
    /**
     * Ödeme oturumu başlatır ve hastanın yönlendirileceği adresi döner.
     *
     * @return array{redirect_url:string, reference:string}
     */
    public function baslat(Payment $payment, string $donusUrl): array;

    /**
     * Sağlayıcıdan gelen bildirimi (webhook) DOĞRULAR ve sonucu çözer.
     *
     * Tarayıcıdan gelen "başarılı" bilgisine asla güvenilmez; ödeme yalnızca
     * burada doğrulanan bildirimle kesinleşir. İmza doğrulaması bu metodun
     * sorumluluğundadır — doğrulanmayan bildirim null döner.
     *
     * @return array{reference:string, durum:string, tutar_minor:int, currency:string}|null
     */
    public function bildirimiCoz(array $govde, array $basliklar): ?array;

    /**
     * İade başlatır. Kısmi iade için tutar verilir.
     *
     * @return array{ok:bool, reference:?string, mesaj:?string}
     */
    public function iade(Payment $payment, int $tutarMinor): array;

    public function ad(): string;
}
