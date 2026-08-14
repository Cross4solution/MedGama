<?php

namespace App\Translation;

/**
 * Motor seçilmediğinde devrede olan uygulama.
 *
 * Çeviri istenirse null döner; çağıran taraf özgün metni gösterir. Bilinçli
 * olarak hata fırlatmıyor: çeviri bir kolaylıktır, yokluğunda içerik yine
 * okunabilir olmalı. (Ödeme sağlayıcısında tersi geçerliydi — orada sessizce
 * devam etmek para kaybı demekti.)
 *
 * Arayüz `kullanilabilir()` false olduğunda toplu çeviri düğmesini pasif
 * gösterir; kullanıcı çalışmayan bir düğmeye basmaz.
 */
class UnavailableEngine implements TranslationEngine
{
    public function kullanilabilir(): bool
    {
        return false;
    }

    public function cevir(string $metin, string $hedefDil, ?string $kaynakDil = null, bool $tibbiMetin = false): ?string
    {
        return null;
    }

    public function dilTespit(string $metin): ?string
    {
        return null;
    }

    public function ad(): string
    {
        return 'unavailable';
    }
}
