<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * E-posta çevirileri — eksik anahtar doğrudan kullanıcıya gider.
 *
 * Laravel bulamadığı anahtarı ANAHTARIN KENDİSİ olarak döndürür. Yani
 * `lang/en/email.php` içinde olmayan bir anahtar, hastanın gelen kutusunda
 * şöyle görünür:
 *
 *     Konu: email.appt_confirmed_subject
 *
 * Hata sessiz: posta gönderilir, kuyruk başarılı, log temiz. Yalnız içerik
 * anlamsızdır ve bunu ilk gören müşteri olur.
 *
 * İki yön de sınanıyor:
 *   • kodun çağırdığı her anahtar dosyada VAR mı  (ham anahtar sızması)
 *   • en ve tr aynı anahtar kümesine sahip mi     (tek dilde eksik çeviri)
 *
 * NOT — dil kapsamı: arka uçta yalnız `en` ve `tr` var, arayüz 9 dil sunuyor.
 * Almanca seçen bir kullanıcı İngilizce posta alır (ölçüldü: fallback `en`,
 * ham anahtar DEĞİL). Bu bir kod hatası değil, çeviri bütçesi kararı; test
 * yalnız ham anahtar sızmadığını garanti ediyor.
 */
class EpostaCevirileriTest extends TestCase
{
    /** Kodda ve şablonlarda geçen tüm `trans('email.x')` anahtarları. */
    private function cagrilanAnahtarlar(): array
    {
        $anahtarlar = [];

        foreach ([base_path('app'), resource_path('views')] as $kok) {
            if (!is_dir($kok)) {
                continue;
            }

            $gezgin = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($kok));

            foreach ($gezgin as $dosya) {
                if (!$dosya->isFile() || !in_array($dosya->getExtension(), ['php'], true)) {
                    continue;
                }

                preg_match_all(
                    "/(?:trans|__)\(\s*'(email\.[a-zA-Z0-9_.]+)'/",
                    file_get_contents($dosya->getPathname()),
                    $eslesme,
                );

                foreach ($eslesme[1] as $a) {
                    $anahtarlar[$a] = true;
                }
            }
        }

        return array_keys($anahtarlar);
    }

    public function test_cagrilan_her_anahtar_ingilizce_dosyada_var(): void
    {
        $cagrilan = $this->cagrilanAnahtarlar();

        $this->assertGreaterThan(100, count($cagrilan), 'anahtar taraması çalışmıyor — desen bozulmuş olabilir');

        $eksik = [];

        foreach ($cagrilan as $anahtar) {
            // trans() bulamazsa anahtarın kendisini döndürür; ölçüt bu.
            if (trans($anahtar, [], 'en') === $anahtar) {
                $eksik[] = $anahtar;
            }
        }

        $this->assertSame(
            [],
            $eksik,
            "Bu anahtarlar lang/en/email.php içinde yok; kullanıcıya ham anahtar gider:\n  "
            . implode("\n  ", $eksik),
        );
    }

    public function test_turkce_dosya_ingilizceyle_ayni_anahtarlari_tasiyor(): void
    {
        // Bir tarafa eklenip diğerine eklenmeyen anahtar, o dildeki
        // kullanıcıya İngilizce (ya da Türkçe) bir cümle olarak sızar —
        // postanın ortasında dil değişir.
        $en = require lang_path('en/email.php');
        $tr = require lang_path('tr/email.php');

        $this->assertSame(
            [],
            array_keys(array_diff_key($en, $tr)),
            'Türkçe dosyada eksik anahtarlar var: ' . implode(', ', array_keys(array_diff_key($en, $tr))),
        );
        $this->assertSame(
            [],
            array_keys(array_diff_key($tr, $en)),
            'İngilizce dosyada eksik anahtarlar var: ' . implode(', ', array_keys(array_diff_key($tr, $en))),
        );
    }

    public function test_ceviriler_bos_degil(): void
    {
        // Boş dizge de sessiz: konu satırı boş bir posta gider.
        $bos = [];

        foreach (['en', 'tr'] as $dil) {
            foreach (require lang_path("{$dil}/email.php") as $anahtar => $deger) {
                if (!is_string($deger) || trim($deger) === '') {
                    $bos[] = "{$dil}/{$anahtar}";
                }
            }
        }

        $this->assertSame([], $bos, 'Boş çeviri: ' . implode(', ', $bos));
    }

    public function test_desteklenmeyen_dil_ham_anahtar_dondurmuyor(): void
    {
        // Arayüz 9 dil sunuyor, arka uçta 2 var. Kullanıcı Almanca seçtiğinde
        // `preferred_language` artık gerçekten `de` yazılıyor (dil seçici bu
        // sütunu eskiden hiç güncellemiyordu), yani bu yol CANLIDA işliyor.
        // Ölçüt: İngilizceye düşsün, ham anahtar göstermesin.
        foreach (['de', 'fr', 'ar', 'ru', 'es', 'it', 'az'] as $dil) {
            $sonuc = trans('email.appt_confirmed_subject', [], $dil);

            $this->assertNotSame(
                'email.appt_confirmed_subject',
                $sonuc,
                "{$dil} dilinde ham anahtar dönüyor — hastaya anahtar adı gider",
            );
            $this->assertSame(trans('email.appt_confirmed_subject', [], 'en'), $sonuc);
        }
    }
}
