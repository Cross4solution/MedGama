<?php

namespace App\Jobs;

use App\Models\MedStreamPost;
use App\Services\VideoSubtitleService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Yüklenen videoyu arka planda yazıya döker.
 *
 * Video işlendikten SONRA kuyruğa alınır; alt yazı üretimi videonun
 * yayınlanmasını bekletmez. Yazıya dökme dakikalar sürebilir — kullanıcı bu
 * sırada videoyu paylaşmış ve devam etmiş olur, alt yazı hazır olunca
 * kendiliğinden görünür.
 */
class TranscribeVideoSubtitles implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Yazıya dökme uzun sürebilir; kuyruğun varsayılan süresi yetmez.
    public int $timeout = 1800;
    public int $tries = 2;

    public function __construct(
        public string $postId,
        public int $mediaIndex,
        public string $dosyaYolu,
        public ?string $dil = null,
    ) {}

    public function handle(VideoSubtitleService $subtitles): void
    {
        $post = MedStreamPost::find($this->postId);

        if (!$post) {
            return; // gönderi silinmiş olabilir
        }

        $subtitles->uret($post, $this->mediaIndex, $this->dosyaYolu, $this->dil);
    }

    public function failed(?\Throwable $e): void
    {
        // Alt yazı bir ek değer: başarısızlığı gönderiyi etkilemez, yalnızca
        // kaydedilir ki neden üretilmediği görülebilsin.
        Log::warning('Alt yazı işi başarısız', [
            'post' => $this->postId,
            'hata' => $e?->getMessage(),
        ]);
    }
}
