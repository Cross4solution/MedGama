<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Kalıcı savunma: boş olabilen bir değerle kapsayan sorgu.
 *
 * Bu hata sınıfı bu kod tabanında BEŞ ayrı sızıntı çıkardı — randevu
 * listesi, hastane faturaları, CRM hasta listesi, hasta kayıtları ve CRM
 * arşivi. Hepsinin mekanizması aynı:
 *
 *     $query->where('clinic_id', $user->clinic_id)
 *
 * Değer boş olduğunda Laravel bunu `WHERE clinic_id IS NULL` haline
 * getiriyor. Amaç "kapsamı daralt" iken sonuç "kliniğe bağlı olmayan HER
 * kaydı eşle" oluyor. Bağımsız doktorların kayıtları tam olarak bu kümede.
 *
 * Hata sessiz: uç 401/403 vermiyor, 200 dönüyor ve fazladan veri veriyor.
 * Tek tek yakalamak yerine desenin kendisi taranıyor.
 *
 * Bu test KAYNAK KODU okuyor. Davranış testi her uca ayrı kurulum
 * gerektirirdi ve yeni eklenen bir ucu hiç görmezdi; aranan şey davranış
 * değil, yapısal bir kusur.
 */
class BosKapsamDegeriTest extends TestCase
{
    /** Boş olabilen kapsam alanları (şemada nullable). */
    private const NULLABLE = [
        'clinic_id', 'hospital_id', 'specialty_id',
    ];

    /**
     * Bilinerek muaf tutulanlar: "dosya:satır" => gerekçe.
     *
     * Buraya bir satır eklemek, "bu değerin boş gelmesi SORUN DEĞİL" demek.
     * Gerekçesiz ekleme yapılmamalı.
     */
    private const MUAF = [
        'app/Http/Controllers/Api/LeadController.php' =>
            'Aday kaydının KENDİ kliniğine göre eşleşen hasta aranıyor; kullanıcı '
            . 'kapsamı değil. Kliniksiz adayda davranışın ne olacağı ürün kararı.',
        'app/Http/Controllers/Api/ClinicController.php' =>
            'Klinik kaydının owner_id alanı; şemada zorunlu, boş gelemiyor.',
    ];

    public function test_bos_gelebilen_degerle_kapsayan_sorgu_yok(): void
    {
        $kusurlu = [];

        foreach ($this->phpDosyalari(base_path('app')) as $yol) {
            $goreli = str_replace(base_path() . '/', '', $yol);

            if (array_key_exists($goreli, self::MUAF)) {
                continue;
            }

            $satirlar = explode("\n", file_get_contents($yol));

            foreach ($satirlar as $i => $satir) {
                $ifade = $this->kapsamIfadesi($satir);

                if ($ifade === null) {
                    continue;
                }

                // Yakın çevrede boşluk denetimi var mı?
                $pencere = implode("\n", array_slice($satirlar, max(0, $i - 8), 12));

                if (!$this->korumaVar($pencere, $ifade)) {
                    $kusurlu[] = $goreli . ':' . ($i + 1) . '  →  ' . trim($satir);
                }
            }
        }

        $this->assertSame(
            [],
            $kusurlu,
            "Boş gelebilen bir değerle kapsanan sorgu var. Boş değer Laravel'de\n"
            . "`IS NULL`'a dönüşüp o alana bağlı OLMAYAN her kaydı eşler — yani\n"
            . "kapsam daralmaz, genişler. Boş hâli açıkça ele alın:\n"
            . "  \$user->clinic_id ? \$q->where(...) : \$q->whereRaw('1 = 0')\n\n  "
            . implode("\n  ", $kusurlu),
        );
    }

    /**
     * Satır kapsam sorgusuysa `$degisken->alan` ifadesini döndürür.
     *
     * `$request->...` KAPSAM DEĞİL, kullanıcı süzgeci: boş gelmesi beklenen
     * bir durum ve çağıran yerler zaten `if`/`when` ile sarıyor. Aranan şey,
     * isteği YAPANIN kimliğine göre daraltma.
     */
    private function kapsamIfadesi(string $satir): ?string
    {
        // Yorum satırları atlanıyor: bu hatayı ANLATAN açıklama blokları
        // kusurlu kodla aynı deseni içeriyor ve tarayıcı kendi belgesini
        // bulguya çeviriyordu.
        $kirpik = ltrim($satir);

        if (str_starts_with($kirpik, '//') || str_starts_with($kirpik, '*') || str_starts_with($kirpik, '/*')) {
            return null;
        }

        $alanlar = implode('|', self::NULLABLE);

        // Hem `->where(...)` hem `Model::where(...)` — statik biçim atlanırsa
        // hastane fatura sızıntısının TAM ŞEKLİ gözden kaçıyor; ilk yazımda
        // öyle oldu ve tarayıcı o hatayı geri koyduğumda bile yeşil kaldı.
        if (preg_match(
            "/(?:->|::)where(?:In)?\(\s*'[\w.]+'\s*,\s*\\\$(?!request\b)(\w+)->({$alanlar})\b/",
            $satir,
            $e,
        )) {
            return '$' . $e[1] . '->' . $e[2];
        }

        return null;
    }

    /**
     * Koruma AYNI ifadeye bağlı olmalı.
     *
     * İlk yazımda pencerede herhangi bir `?` ya da `HastaneKapsami` dizgesi
     * aranıyordu. İkisi de her yerde geçiyor — nullable tip imzaları, `?->`,
     * ilgisiz üçlü işleçler, hatta yardımcı sınıfın KENDİ adı. Sonuç: tarayıcı
     * gerçek iki hatayı geri koyduğumda bile yeşil kaldı. Ölçüt artık
     * `$user->clinic_id` ifadesinin boşluk denetimine girmiş olması.
     */
    private function korumaVar(string $pencere, string $ifade): bool
    {
        $q = preg_quote($ifade, '/');

        $kaliplar = [
            "/if \\(\\s*!?\\s*{$q}\\b/",          // if ($user->clinic_id) / if (!$user->clinic_id)
            "/{$q}\\s*\\?/",                        // $user->clinic_id ? ... : ...
            "/{$q}\\s*\\?\\?/",                    // $user->clinic_id ?? ...
            "/{$q}\\s*\\?:/",                       // $user->clinic_id ?: ...
            "/&&\\s*{$q}\\b/",                      // ... && $record->clinic_id
            "/{$q}\\s*&&/",
        ];

        foreach ($kaliplar as $kalip) {
            if (preg_match($kalip, $pencere)) {
                return true;
            }
        }

        return false;
    }

    /** @return string[] */
    private function phpDosyalari(string $kok): array
    {
        $bulunan = [];
        $gezgin = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($kok));

        foreach ($gezgin as $dosya) {
            if ($dosya->isFile() && $dosya->getExtension() === 'php') {
                $bulunan[] = $dosya->getPathname();
            }
        }

        return $bulunan;
    }
}
