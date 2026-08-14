<?php

namespace App\Translation;

/**
 * Metin çeviri motoru.
 *
 * Motor henüz yok: çeviri kendi sunucumuzda çalışan bir dil modeliyle
 * yapılacak ve o model GPU bekliyor. Uygulamanın geri kalanı bu arayüzle
 * konuşur; GPU geldiğinde yalnızca bu arayüzü uygulayan bir sınıf yazılır.
 *
 * UYUM NOTU: Hasta mesajları sağlık verisidir. Bu arayüzü uygulayan bir sınıf
 * metni ÜÇÜNCÜ TARAF bir servise gönderemez — çeviri kendi sunucumuzda
 * yapılır. Karar (2026-08-12): dış çeviri servisi kullanılmayacak.
 *
 * Tıbbi metinde sıradan çeviri yetmez: "şikayet", "ağrı", "takip" gibi
 * kelimelerin günlük anlamıyla çevrilmesi yanlış sonuç üretir. Motoru
 * uygulayan sınıf, metnin tıbbi olduğunu modele bildirmelidir.
 */
interface TranslationEngine
{
    public function kullanilabilir(): bool;

    /**
     * Metni hedef dile çevirir.
     *
     * @param  string      $metin
     * @param  string      $hedefDil    ISO kodu (tr, en, de...)
     * @param  string|null $kaynakDil   Bilinmiyorsa null — motor tespit eder
     * @param  bool        $tibbiMetin  Tıbbi terimlerin korunması gerekiyorsa
     * @return string|null  Çeviri; başarısızsa null (özgün metin gösterilir)
     */
    public function cevir(string $metin, string $hedefDil, ?string $kaynakDil = null, bool $tibbiMetin = false): ?string;

    /** Metnin dilini tespit eder. Bilinemezse null. */
    public function dilTespit(string $metin): ?string;

    public function ad(): string;
}
