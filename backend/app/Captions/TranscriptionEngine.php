<?php

namespace App\Captions;

/**
 * Konuşmayı yazıya çeviren motor.
 *
 * Motor henüz yok: gerçek zamanlı çalışması GPU gerektiriyor ve sunucu
 * beklemede. Uygulamanın geri kalanı bu arayüzle konuşur; GPU gelince yalnızca
 * bu arayüzü uygulayan bir sınıf yazılır ve ayardan seçilir — ekran, onay
 * akışı ve sinyal yolu değişmez.
 *
 * UYUM NOTU: Hasta konuşması sağlık verisidir. Bu arayüzü uygulayan bir sınıf
 * sesi ÜÇÜNCÜ TARAF bir servise gönderemez; ya kendi sunucumuzda çalışan bir
 * model olur, ya da imzalı sözleşmesi (BAA) olan bir sağlayıcı. Ses yazıya
 * çevrildikten sonra saklanmaz.
 */
interface TranscriptionEngine
{
    /** Motor şu an kullanılabilir mi? (GPU/servis ayakta mı) */
    public function kullanilabilir(): bool;

    /**
     * CANLI görüşme için yazıya çevirme oturumu açar; tarayıcının sesi
     * göndereceği adresi döner. Gerçek zamanlı çalışmak zorunda olduğu için
     * GPU gerektirir.
     *
     * @return array{url:string, token:string, expires_in:int}
     */
    public function oturumAc(string $appointmentId, string $konusmaDili): array;

    /**
     * KAYITLI bir video/ses dosyasını yazıya döker.
     *
     * Canlı oturumdan ayrı bir yetenek: gerçek zamanlı olmak zorunda değil,
     * arka planda dakikalarca sürebilir. Bu yüzden GPU olmadan da (CPU'da,
     * yavaşça) çalışabilen bir uygulama yazılabilir — gönderi videolarının
     * alt yazısı canlı görüşmeden önce devreye alınabilir.
     *
     * @param  string      $dosyaYolu  Yerel yol veya erişilebilir URL
     * @param  string|null $dil        Bilinmiyorsa null — motor tespit eder
     * @return array{language:string, segments:array<int,array{start:float,end:float,text:string}>}|null
     *         Başarısızsa null.
     */
    public function dosyaCevir(string $dosyaYolu, ?string $dil = null): ?array;

    /** Kayıtlı dosya çevirisi kullanılabilir mi? (canlıdan ayrı olabilir) */
    public function dosyaCevirisiVarMi(): bool;

    /** Desteklediği kaynak dilleri. */
    public function diller(): array;

    public function ad(): string;
}
