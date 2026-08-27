<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use ReflectionMethod;
use ReflectionNamedType;

/**
 * API belgelendirmesini GERÇEK rotalardan üretir.
 *
 * Depoda elle yazılmış anotasyonlar VAR — PHP 8 öznitelik biçiminde
 * (`#[OA\Get]`), dokuz dosyaya dağılmış. Ama 376 ucun yalnız 50'sini
 * kapsıyorlar: geri kalan %87 hiç belgelenmemiş.
 *
 * Elle yazılan anotasyon iyi belge üretiyor ama iki sorunu var: 326 uç için
 * yazılması büyük bir iş, ve yazıldıktan sonra koddan AYRI bir metin olarak
 * kalıyor — uç değişince kimse güncellemiyor ve belge sessizce yanlışa
 * dönüyor. Zaten bu yüzden yalnız %13'ü kapsıyor.
 *
 * ── Yaklaşım: üret, sonra elle yazılanı ÜSTÜNE koy ────────────────────
 *
 * Rota tablosundan üretilen taban her ucu kapsıyor ve kayamaz. Elle yazılmış
 * anotasyonlar bunun üzerine biniyor: nerede varsa onların açıklaması,
 * örnekleri ve şeması kazanıyor. Kimsenin emeği çöpe gitmiyor, ama
 * belgelenmemiş uç da kalmıyor.
 *
 * Tabanda üretilen şey rotanın kendisinden okunuyor:
 *
 *   • yol, yöntem, denetleyici — rota tablosundan
 *   • kimlik ve rol gereksinimi — ara katman listesinden
 *   • istek alanları — FormRequest'in `rules()` çıktısından
 *   • olası yanıt kodları — kapının ne olduğundan (401/403/422/404)
 *
 * Hepsi çalışan koddan türediği için belge kayamaz. Uç değişirse belge
 * değişir; uç silinirse belgeden düşer.
 */
class ApiBelgesiUret extends Command
{
    protected $signature = 'api:belge-uret {--cikti=storage/api-docs/api-docs.json}';

    protected $description = 'OpenAPI belgesini gerçek rota tablosundan üretir';

    public function handle(): int
    {
        $yollar = [];
        $sayac = 0;

        foreach (Route::getRoutes() as $rota) {
            if (!str_starts_with($rota->uri(), 'api/')) {
                continue;
            }

            $yol = '/' . $rota->uri();
            $araKatman = $rota->gatherMiddleware();

            foreach ($rota->methods() as $yontem) {
                if (in_array($yontem, ['HEAD', 'OPTIONS'], true)) {
                    continue;
                }

                $yollar[$yol][strtolower($yontem)] = $this->islem($rota, $araKatman);
                $sayac++;
            }
        }

        ksort($yollar);

        $belge = [
            'openapi' => '3.0.0',
            'info' => [
                'title'   => 'Medagama API',
                'version' => '1.0.0',
                'description' =>
                    "Bu belge `php artisan api:belge-uret` ile GERÇEK rota tablosundan üretilir. " .
                    "Elle düzenlenmez — bir sonraki üretimde üzerine yazılır. " .
                    "Uç değişirse belge değişir, uç silinirse belgeden düşer.",
            ],
            'servers'    => [['url' => config('app.url')]],
            'components' => [
                'securitySchemes' => [
                    'sanctum' => ['type' => 'http', 'scheme' => 'bearer', 'bearerFormat' => 'Token'],
                ],
            ],
            'paths' => $yollar,
        ];

        $belge['paths'] = $this->elleYazilaniUsteKoy($yollar);

        $ciktiYolu = base_path($this->option('cikti'));
        @mkdir(dirname($ciktiYolu), 0755, true);
        file_put_contents(
            $ciktiYolu,
            json_encode($belge, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        );

        $this->info(sprintf('%d uç, %d yol belgelendi → %s', $sayac, count($yollar), $this->option('cikti')));

        return self::SUCCESS;
    }

    /**
     * Elle yazılmış anotasyonları üretilen tabanın ÜSTÜNE koyar.
     *
     * `l5-swagger:generate` özniteliklerden bir belge üretiyor; o belgede olan
     * her işlem, üretilen tabandakinin yerine geçiyor. Elle yazılan açıklama,
     * örnek ve şema üretilenden daha zengin — kaybedilmemeli.
     *
     * Yalnız ÜSTÜNE konuyor, birleştirilmiyor: iki kaynağı alan alan
     * harmanlamak, hangi bilginin nereden geldiğini belirsizleştirir ve
     * çelişki çıktığında sessizce yanlış bir karma üretir.
     *
     * @param array<string,array<string,mixed>> $taban
     * @return array<string,array<string,mixed>>
     */
    private function elleYazilaniUsteKoy(array $taban): array
    {
        $gecici = storage_path('api-docs/anotasyon-gecici.json');

        try {
            $this->callSilent('l5-swagger:generate');
        } catch (\Throwable) {
            $this->warn('Anotasyon belgesi üretilemedi; yalnız rota tabanı kullanılıyor.');

            return $taban;
        }

        $anotasyonYolu = storage_path('api-docs/api-docs.json');

        if (!is_file($anotasyonYolu)) {
            return $taban;
        }

        $anotasyon = json_decode((string) file_get_contents($anotasyonYolu), true);
        $bindirilen = 0;

        foreach ($anotasyon['paths'] ?? [] as $yol => $islemler) {
            // Anotasyon yolları önek taşımıyor olabilir; ikisini de dene.
            foreach ([$yol, '/api' . $yol] as $aday) {
                if (!isset($taban[$aday])) {
                    continue;
                }

                foreach ($islemler as $yontem => $islem) {
                    if (isset($taban[$aday][$yontem])) {
                        $taban[$aday][$yontem] = $islem;
                        $bindirilen++;
                    }
                }

                break;
            }
        }

        @unlink($gecici);

        if ($bindirilen) {
            $this->line("{$bindirilen} işlem elle yazılmış anotasyondan alındı.");
        }

        return $taban;
    }

    /** @param string[] $araKatman */
    private function islem($rota, array $araKatman): array
    {
        $kimlikGerekli = $this->kimlikGerekli($araKatman);
        $roller = $this->roller($araKatman);

        $islem = [
            'summary'  => $this->ozet($rota),
            'tags'     => [$this->etiket($rota->uri())],
            'security' => $kimlikGerekli ? [['sanctum' => []]] : [],
            'responses' => $this->yanitlar($rota, $kimlikGerekli, $roller),
        ];

        if ($roller) {
            $islem['description'] = 'Yalnız şu roller: ' . implode(', ', $roller);
        }

        $parametreler = $this->yolParametreleri($rota->uri());
        if ($parametreler) {
            $islem['parameters'] = $parametreler;
        }

        $govde = $this->istekGovdesi($rota);
        if ($govde) {
            $islem['requestBody'] = $govde;
        }

        return $islem;
    }

    /** @param string[] $araKatman */
    private function kimlikGerekli(array $araKatman): bool
    {
        foreach ($araKatman as $k) {
            if (str_contains($k, 'Authenticate') || str_starts_with($k, 'auth:')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Rol kapısını ara katmandan okur.
     *
     * Rotanın kendisinden okunduğunda ara katman TAKMA ADIYLA geliyor
     * (`role:superAdmin,saasAdmin`), `route:list --json` çıktısındaki
     * çözülmüş sınıf adıyla (`App\Http\Middleware\CheckRole:...`) değil.
     * İlk sürüm yalnız sınıf adını arıyordu ve hiçbir rol kapısını
     * göremiyordu — admin uçları "herkese açık" gibi belgeleniyordu. İkisi de
     * karşılanıyor.
     *
     * @param string[] $araKatman
     * @return string[]
     */
    private function roller(array $araKatman): array
    {
        foreach ($araKatman as $k) {
            foreach (['role:', 'CheckRole:'] as $onek) {
                if (str_contains($k, $onek)) {
                    return array_map('trim', explode(',', Str::after($k, $onek)));
                }
            }
        }

        return [];
    }

    /** @return array<int,array<string,mixed>> */
    private function yolParametreleri(string $uri): array
    {
        preg_match_all('/\{(\w+)\??\}/', $uri, $eslesme);

        return array_map(fn ($ad) => [
            'name'     => $ad,
            'in'       => 'path',
            'required' => true,
            'schema'   => ['type' => 'string'],
        ], $eslesme[1]);
    }

    /**
     * İstek alanlarını FormRequest'in doğrulama kurallarından çıkarır.
     *
     * Kurallar çalışan kod: doğrulama değişince belge de değişir. Elle yazılan
     * bir alan listesi ise değişmez ve sessizce yanlışa döner.
     */
    private function istekGovdesi($rota): ?array
    {
        $eylem = $rota->getActionName();

        if (!str_contains($eylem, '@')) {
            return null;
        }

        [$sinif, $metot] = explode('@', $eylem);

        try {
            $yansima = new ReflectionMethod($sinif, $metot);
        } catch (\Throwable) {
            return null;
        }

        foreach ($yansima->getParameters() as $parametre) {
            $tip = $parametre->getType();

            if (!$tip instanceof ReflectionNamedType || $tip->isBuiltin()) {
                continue;
            }

            $tipAdi = $tip->getName();

            if (!is_subclass_of($tipAdi, FormRequest::class)) {
                continue;
            }

            try {
                $kurallar = (new $tipAdi())->rules();
            } catch (\Throwable) {
                return null;
            }

            return $this->kurallardanGovde($kurallar);
        }

        return null;
    }

    /** @param array<string,mixed> $kurallar */
    private function kurallardanGovde(array $kurallar): ?array
    {
        $ozellikler = [];
        $zorunlu = [];

        foreach ($kurallar as $alan => $kural) {
            // `dizi.*` biçimindeki alt kurallar üst alanın parçası; ayrı
            // gösterilirse belge gerçekte olmayan bir alan uydurmuş olur.
            if (str_contains($alan, '.')) {
                continue;
            }

            $metin = is_array($kural) ? implode('|', array_filter($kural, 'is_string')) : (string) $kural;

            $ozellikler[$alan] = ['type' => $this->tip($metin), 'description' => $metin];

            if (str_contains($metin, 'required')) {
                $zorunlu[] = $alan;
            }
        }

        if (!$ozellikler) {
            return null;
        }

        $sema = ['type' => 'object', 'properties' => $ozellikler];

        if ($zorunlu) {
            $sema['required'] = $zorunlu;
        }

        return ['content' => ['application/json' => ['schema' => $sema]]];
    }

    private function tip(string $kural): string
    {
        return match (true) {
            str_contains($kural, 'integer'), str_contains($kural, 'numeric') => 'integer',
            str_contains($kural, 'boolean')                                   => 'boolean',
            str_contains($kural, 'array')                                     => 'array',
            str_contains($kural, 'file'), str_contains($kural, 'image')       => 'string',
            default                                                           => 'string',
        };
    }

    /**
     * Olası yanıt kodları KAPIDAN türetiliyor.
     *
     * Uydurmuyoruz: kimlik gerekiyorsa 401 mümkündür, rol kapısı varsa 403
     * mümkündür, istek gövdesi doğrulanıyorsa 422 mümkündür. Yol parametresi
     * varsa kayıt bulunamayabilir, yani 404.
     *
     * @param string[] $roller
     */
    private function yanitlar($rota, bool $kimlikGerekli, array $roller): array
    {
        $yanitlar = ['200' => ['description' => 'Başarılı']];

        if (in_array('POST', $rota->methods(), true)) {
            $yanitlar['201'] = ['description' => 'Oluşturuldu'];
        }

        if ($kimlikGerekli) {
            $yanitlar['401'] = ['description' => 'Oturum yok ya da jeton geçersiz'];
        }

        if ($roller) {
            $yanitlar['403'] = ['description' => 'Bu rol erişemez: ' . implode(', ', $roller)];
        }

        if ($this->istekGovdesi($rota)) {
            $yanitlar['422'] = ['description' => 'Doğrulama hatası'];
        }

        if ($this->yolParametreleri($rota->uri())) {
            $yanitlar['404'] = ['description' => 'Kayıt bulunamadı'];
        }

        $yanitlar['429'] = ['description' => 'Hız sınırı aşıldı'];

        return $yanitlar;
    }

    private function ozet($rota): string
    {
        $eylem = $rota->getActionName();

        if (!str_contains($eylem, '@')) {
            return $rota->uri();
        }

        [$sinif, $metot] = explode('@', $eylem);

        return class_basename($sinif) . '::' . $metot;
    }

    private function etiket(string $uri): string
    {
        $parcalar = explode('/', $uri);

        return $parcalar[1] ?? 'api';
    }
}
