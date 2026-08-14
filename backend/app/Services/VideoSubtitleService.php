<?php

namespace App\Services;

use App\Captions\TranscriptionEngine;
use App\Models\MedStreamPost;
use App\Models\User;
use App\Models\VideoSubtitle;
use Illuminate\Support\Facades\Log;

/**
 * Gönderi videolarının alt yazıları.
 *
 * Akış:
 *  1. Video yüklenince arka planda sesten yazıya dökülür → 'original' alt yazı
 *  2. Başka dilde isteyen olduğunda o dile çevrilir → 'translation' alt yazı
 *  3. Her ikisi de saklanır; ikinci izleyen hazır bulur
 *
 * Canlı görüşmeden ayrı tasarlandı çünkü koşulları farklı: burada gecikme
 * sorun değil, sonuç tekrar kullanılabiliyor ve içerik herkese açık.
 */
class VideoSubtitleService
{
    public function __construct(
        private readonly TranscriptionEngine $engine,
        private readonly TranslationService $translator,
    ) {}

    /**
     * Videoyu yazıya döker ve konuşulan dildeki alt yazıyı kaydeder.
     * Motor yoksa sessizce geçer — alt yazı bir ek değerdir, videonun
     * yayınlanmasını engellememelidir.
     */
    public function uret(MedStreamPost $post, int $mediaIndex, string $dosyaYolu, ?string $dil = null): ?VideoSubtitle
    {
        if (!$this->engine->dosyaCevirisiVarMi()) {
            return null;
        }

        // Kayıt DİLE göre değil, "bu videonun özgün alt yazısı" olarak aranır:
        // dil ancak yazıya dökme bittiğinde kesinleşiyor. Dile göre arasaydık
        // her çalıştırmada yeni satır açılır, doktorun düzeltmesi görülmezdi.
        $kayit = VideoSubtitle::firstOrNew([
            'post_id'     => $post->id,
            'media_index' => $mediaIndex,
            'kind'        => 'original',
        ]);

        if (!$kayit->exists) {
            $kayit->language = $dil ?: 'auto';
            $kayit->status   = VideoSubtitle::BEKLIYOR;
            $kayit->save();
        }

        // Doktor düzelttiyse üzerine yazma.
        if ($kayit->edited) {
            return $kayit;
        }

        try {
            $sonuc = $this->engine->dosyaCevir($dosyaYolu, $dil);
        } catch (\Throwable $e) {
            Log::warning('Alt yazı üretilemedi', ['post' => $post->id, 'hata' => $e->getMessage()]);
            $kayit->update(['status' => VideoSubtitle::HATA, 'error' => $e->getMessage()]);
            return $kayit;
        }

        if (!$sonuc || empty($sonuc['segments'])) {
            $kayit->update(['status' => VideoSubtitle::HATA, 'error' => 'Boş sonuç']);
            return $kayit;
        }

        // Dil ancak işlem sonunda kesinleşiyor (motor tespit ediyor).
        $kayit->language = $sonuc['language'] ?: ($dil ?: 'en');
        $kayit->segments = $sonuc['segments'];
        $kayit->status   = VideoSubtitle::HAZIR;
        $kayit->engine   = $this->engine->ad();
        $kayit->save();

        return $kayit;
    }

    /**
     * İstenen dildeki alt yazıyı döner; yoksa özgün alt yazıdan çevirip saklar.
     * Çeviri satır satır yapılır ki zaman damgaları bozulmasın.
     */
    public function getir(MedStreamPost $post, int $mediaIndex, string $dil): ?VideoSubtitle
    {
        $mevcut = VideoSubtitle::where([
            'post_id' => $post->id, 'media_index' => $mediaIndex, 'language' => $dil,
        ])->first();

        if ($mevcut?->hazirMi()) {
            return $mevcut;
        }

        $ozgun = VideoSubtitle::where([
            'post_id' => $post->id, 'media_index' => $mediaIndex, 'kind' => 'original',
        ])->where('status', VideoSubtitle::HAZIR)->first();

        if (!$ozgun) {
            return null; // henüz yazıya dökülmemiş
        }

        if ($ozgun->language === $dil) {
            return $ozgun;
        }

        $parcalar = $ozgun->segments ?? [];
        $cevrilen = [];

        foreach ($parcalar as $p) {
            $metin = trim($p['text'] ?? '');
            if ($metin === '') {
                $cevrilen[] = $p;
                continue;
            }

            $r = $this->translator->translate($metin, $dil, $ozgun->language);
            $cevrilen[] = ['start' => $p['start'] ?? 0, 'end' => $p['end'] ?? 0, 'text' => $r['translated_text']];
        }

        return VideoSubtitle::updateOrCreate(
            ['post_id' => $post->id, 'media_index' => $mediaIndex, 'language' => $dil],
            [
                'kind'     => 'translation',
                'status'   => VideoSubtitle::HAZIR,
                'segments' => $cevrilen,
                'engine'   => 'translation',
            ],
        );
    }

    /**
     * Doktorun düzeltmesi. İşaretlenen kayıt bir daha otomatik üretimle
     * değiştirilmez: ilaç ve hastalık adlarında makine sık yanılıyor, elle
     * düzeltilmiş metnin geri bozulması yayında hataya dönüşür.
     */
    public function duzelt(VideoSubtitle $altyazi, array $parcalar, User $kullanici): VideoSubtitle
    {
        $altyazi->update([
            'segments'  => array_values(array_map(fn ($p) => [
                'start' => (float) ($p['start'] ?? 0),
                'end'   => (float) ($p['end'] ?? 0),
                'text'  => (string) ($p['text'] ?? ''),
            ], $parcalar)),
            'status'    => VideoSubtitle::HAZIR,
            'edited'    => true,
            'edited_by' => $kullanici->id,
            'edited_at' => now(),
        ]);

        // Özgün metin değiştiği için eski çeviriler artık geçersiz.
        if ($altyazi->kind === 'original') {
            VideoSubtitle::where('post_id', $altyazi->post_id)
                ->where('media_index', $altyazi->media_index)
                ->where('kind', 'translation')
                ->delete();
        }

        return $altyazi->fresh();
    }
}
