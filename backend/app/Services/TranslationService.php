<?php

namespace App\Services;

use App\Models\Translation;
use App\Translation\TranslationEngine;
use Illuminate\Support\Facades\Log;

/**
 * İçerik çevirisi — istendiğinde çevir, sonucu sakla.
 *
 * Platformdaki metinler ikiye ayrılır:
 *  • Sabit arayüz (menü, düğme) — dil dosyalarından gelir, buraya uğramaz
 *  • Kullanıcı içeriği (gönderi, yorum, mesaj) — yazıldığı dilde durur;
 *    kullanıcı "içerikler de benim dilimde görünsün" derse burası devreye girer
 *
 * Çeviri hiçbir zaman özgün metnin yerine geçmez: kayıt yerinde durur, çeviri
 * ayrı tutulur ve arayüz "otomatik çeviri" olduğunu belirtir. Yanlış bir
 * çevirinin özgün metni silmesi, tıbbi bağlamda kabul edilemez.
 */
class TranslationService
{
    public function __construct(
        private readonly TranslationEngine $engine,
    ) {}

    public function kullanilabilir(): bool
    {
        return $this->engine->kullanilabilir();
    }

    /**
     * Tek bir metni çevirir. Önce önbelleğe bakar.
     *
     * @return array{text:string, translated:bool, source_lang:?string}
     *         translated=false ise özgün metin dönmüştür.
     */
    public function cevir(
        string $tur,
        string $kayitId,
        string $alan,
        string $metin,
        string $hedefDil,
        ?string $kaynakDil = null,
        bool $tibbiMetin = false,
    ): array {
        $ozgun = ['text' => $metin, 'translated' => false, 'source_lang' => $kaynakDil];

        if (trim($metin) === '' || !$this->engine->kullanilabilir()) {
            return $ozgun;
        }

        // Zaten hedef dildeyse çevirme — gereksiz iş ve kalite kaybı.
        if ($kaynakDil && $kaynakDil === $hedefDil) {
            return $ozgun;
        }

        $ozet = hash('sha256', $metin);

        $kayit = Translation::where([
            'source_type' => $tur,
            'source_id'   => $kayitId,
            'field'       => $alan,
            'target_lang' => $hedefDil,
        ])->first();

        // İçerik düzenlendiyse özet tutmaz; eski çeviri kullanılmaz.
        if ($kayit && $kayit->source_hash === $ozet && $kayit->translated) {
            return ['text' => $kayit->translated, 'translated' => true, 'source_lang' => $kayit->source_lang];
        }

        try {
            $cevrilen = $this->engine->cevir($metin, $hedefDil, $kaynakDil, $tibbiMetin);
        } catch (\Throwable $e) {
            // Çeviri bir kolaylıktır; başarısızlığı içeriği gizlemeye dönüşmemeli.
            Log::warning('Çeviri başarısız', ['tur' => $tur, 'hedef' => $hedefDil, 'hata' => $e->getMessage()]);
            return $ozgun;
        }

        if ($cevrilen === null || trim($cevrilen) === '') {
            return $ozgun;
        }

        Translation::updateOrCreate(
            [
                'source_type' => $tur,
                'source_id'   => $kayitId,
                'field'       => $alan,
                'target_lang' => $hedefDil,
            ],
            [
                'source_lang' => $kaynakDil,
                'source_hash' => $ozet,
                'translated'  => $cevrilen,
            ],
        );

        return ['text' => $cevrilen, 'translated' => true, 'source_lang' => $kaynakDil];
    }

    /**
     * Bir listeyi topluca çevirir — akış sayfası tek seferde geldiği için
     * kayıt başına ayrı istek atmak yerine hepsi burada işlenir.
     *
     * @param  array<int,array{type:string,id:string,field:string,text:string,lang?:string}> $kayitlar
     * @return array<string,array{text:string,translated:bool}>  anahtar: "tur:id:alan"
     */
    public function topluCevir(array $kayitlar, string $hedefDil, bool $tibbiMetin = false): array
    {
        $sonuc = [];

        foreach ($kayitlar as $k) {
            $anahtar = "{$k['type']}:{$k['id']}:{$k['field']}";
            $sonuc[$anahtar] = $this->cevir(
                $k['type'], $k['id'], $k['field'], $k['text'],
                $hedefDil, $k['lang'] ?? null, $tibbiMetin,
            );
        }

        return $sonuc;
    }

    /**
     * İçerik düzenlendiğinde eski çevirileri düşürür.
     * Özet kontrolü zaten koruyor; bu, gereksiz satırları temizler.
     */
    public function unut(string $tur, string $kayitId): void
    {
        Translation::where('source_type', $tur)->where('source_id', $kayitId)->delete();
    }
}
