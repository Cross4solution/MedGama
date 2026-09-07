<?php

namespace App\Captions;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Kendi sunucumuzdaki Whisper servisi (deploy/stt).
 *
 * Uyum: ses üçüncü tarafa gitmez. Servis OVH'deki kendi makinemizde,
 * diske yazmadan çevirir; çeviri de aynı makinedeki LibreTranslate'e gider.
 *
 * Bugün CPU'da küçük model ("şimdilik" kararı, 7 Eylül 2026). GPU sunucu
 * gelince yalnız servis tarafında model büyür; bu sınıf, uç noktalar ve
 * jeton biçimi aynı kalır — Laravel'de tek satır değişmez.
 *
 * Jeton biçimi servisle BİREBİR aynı olmak zorunda (deploy/stt/app.py,
 * `jeton_dogrula`):
 *   "<appointmentId>.<exp>.<hex(HMAC_SHA256(secret, "<appointmentId>.<exp>"))>"
 * Randevuya bağlı ve süreli: başka bir randevunun jetonuyla ses gönderilemez.
 */
class WhisperEngine implements TranscriptionEngine
{
    private string $url;
    private string $secret;

    public function __construct(?string $url = null, ?string $secret = null)
    {
        $this->url = rtrim((string) ($url ?? config('captions.whisper.url')), '/');
        $this->secret = (string) ($secret ?? config('captions.whisper.secret'));
    }

    public function kullanilabilir(): bool
    {
        if ($this->url === '' || $this->secret === '') {
            return false;
        }

        // Her görüşme açılışında sunucuya gitmesin; bir dakikalık önbellek.
        // Servis düştüğünde en geç bir dakika içinde düğme pasifleşir.
        // Anahtar adrese bağlı: adres değişince (GPU sunucuya geçiş) eski
        // sunucunun "hazır" kaydı yeni adres için geçerli sayılmasın.
        return (bool) Cache::remember('captions.whisper.saglik.' . md5($this->url), 60, function () {
            try {
                $res = Http::timeout(4)->get($this->url . '/health');
                return $res->successful() && (bool) $res->json('ok');
            } catch (\Throwable $e) {
                Log::info('Alt yazı motoru ulaşılamıyor: ' . $e->getMessage());
                return false;
            }
        });
    }

    public function oturumAc(string $appointmentId, string $konusmaDili): array
    {
        $sure = (int) config('captions.whisper.token_ttl', 3600);
        $exp = time() + $sure;

        return [
            'url'        => $this->url . '/transcribe',
            'token'      => self::jetonUret($this->secret, $appointmentId, $exp),
            'expires_in' => $sure,
        ];
    }

    /** Servisle paylaşılan jeton üretimi; testte de aynı fonksiyon kullanılır. */
    public static function jetonUret(string $secret, string $appointmentId, int $exp): string
    {
        $govde = $appointmentId . '.' . $exp;
        return $govde . '.' . hash_hmac('sha256', $govde, $secret);
    }

    public function dosyaCevir(string $dosyaYolu, ?string $dil = null): ?array
    {
        if (!$this->kullanilabilir()) {
            return null;
        }
        if (!is_readable($dosyaYolu)) {
            Log::warning('Alt yazı: dosya okunamıyor', ['yol' => $dosyaYolu]);
            return null;
        }

        $res = Http::timeout(600)
            ->withHeaders(['X-Stt-Secret' => $this->secret])
            ->attach('audio', fopen($dosyaYolu, 'r'), basename($dosyaYolu))
            ->post($this->url . '/transcribe-file', array_filter(['lang' => $dil]));

        if (!$res->successful()) {
            Log::warning('Alt yazı: dosya çevirisi başarısız', ['durum' => $res->status()]);
            return null;
        }

        return [
            'language' => (string) ($res->json('language') ?: ($dil ?: 'en')),
            'segments' => (array) $res->json('segments', []),
        ];
    }

    public function dosyaCevirisiVarMi(): bool
    {
        return $this->kullanilabilir();
    }

    public function diller(): array
    {
        return (array) config('captions.languages', []);
    }

    public function ad(): string
    {
        return 'whisper';
    }
}
