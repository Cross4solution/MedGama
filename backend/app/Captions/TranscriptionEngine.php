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
     * Bu görüşme için bir yazıya çevirme oturumu açar ve tarayıcının sesi
     * göndereceği adresi döner.
     *
     * @return array{url:string, token:string, expires_in:int}
     */
    public function oturumAc(string $appointmentId, string $konusmaDili): array;

    /** Desteklediği kaynak dilleri. */
    public function diller(): array;

    public function ad(): string;
}
