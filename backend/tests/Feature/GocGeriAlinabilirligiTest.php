<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Geri alınamayan göç EKLENMESİN — ya da bilerek eklensin.
 *
 * Bir dağıtım ters gittiğinde ilk refleks kodu geri almak. Bu çoğu zaman
 * çalışıyor, çünkü göçlerin büyük kısmı yalnızca EKLİYOR: yeni sütun, yeni
 * indeks. Eski kod fazlalığı görmezden gelir.
 *
 * Bazı göçler ise var olan VERİYİ dönüştürüyor ya da siliyor. Onlardan sonra
 * kodu geri almak uygulamayı bozuyor: veritabanı yeni biçimde, eski kod eski
 * biçim bekliyor. `docs/GERI-ALMA-PLANI.md` bunun somut örneklerini taşıyor —
 * iletişim mesajı gövdeleri şifrelendikten sonra eski koda dönülürse kullanıcı
 * ekranında şifreli metin görüyor.
 *
 * `down()` gövdesi boş olan bir göç "geri alındım" der ve hiçbir şey yapmaz.
 * `migrate:rollback` sessizce başarılı görünür, şema ile veri arasındaki
 * ilişki bozulur.
 *
 * Bu ölçüt böyle göçleri YASAKLAMIYOR — bazıları gerçekten geri alınamaz
 * (veri temizleme, geri doldurma). İstediği şey, listeye açıkça yazılmaları:
 * yeni bir tane eklendiğinde test kırmızıya döner ve yazan kişi geri
 * alınabilirliği düşünmek zorunda kalır. Kayıt tutulmayan kısıt, kısıt değildir.
 */
class GocGeriAlinabilirligiTest extends TestCase
{
    /**
     * `down()` gövdesi bilerek boş olan göçler.
     *
     * Buraya eklemeden önce sorun: gerçekten geri alınamaz mı, yoksa yazmak mı
     * zahmetli geldi? İkincisiyse yazın — geri alma anında kimsenin vakti
     * olmayacak.
     */
    private const GERI_ALINAMAYANLAR = [
        '2026_03_14_140000_create_hospitals_table_and_relations',
        '2026_03_14_150000_convert_catalog_translations_to_named_columns',
        '2026_03_19_160000_cleanup_garbage_reviews',
        '2026_04_01_100000_backfill_doctor_profile_slugs',
        '2026_08_12_150000_drop_duplicate_translations_table',
        '2026_08_15_120000_fix_appointment_status_check_on_sqlite',
        '2026_08_19_160000_refresh_stale_demo_content',
        '2026_08_21_120000_backfill_missing_usernames',
        '2026_08_26_120000_dogrulama_basvurusuna_bilgi_istendi_durumu',
        '2026_08_27_090000_indeks_temizligi_ve_denetim_indeksi',
        '2026_08_27_110000_iletisim_mesaji_govdesini_sifrele',
    ];

    /** @return array<string,string> göç adı → down() gövdesi */
    private function gocGovdeleri(): array
    {
        $govdeler = [];

        foreach (glob(database_path('migrations/*.php')) as $yol) {
            $kaynak = (string) file_get_contents($yol);

            preg_match('/public function down\(\)[^{]*\{(.*?)\n    \}/s', $kaynak, $eslesme);

            $govdeler[basename($yol, '.php')] = isset($eslesme[1])
                ? trim((string) preg_replace('#//.*|/\*.*?\*/#s', '', $eslesme[1]))
                : '';
        }

        return $govdeler;
    }

    public function test_her_gocte_down_var(): void
    {
        $eksik = [];

        foreach (glob(database_path('migrations/*.php')) as $yol) {
            if (!str_contains((string) file_get_contents($yol), 'public function down')) {
                $eksik[] = basename($yol, '.php');
            }
        }

        $this->assertSame([], $eksik, "`down()` yazılmamış göç:\n  " . implode("\n  ", $eksik));
    }

    public function test_geri_alinamayan_goc_listede(): void
    {
        $listedeOlmayan = [];

        foreach ($this->gocGovdeleri() as $ad => $govde) {
            if ($govde === '' && !in_array($ad, self::GERI_ALINAMAYANLAR, true)) {
                $listedeOlmayan[] = $ad;
            }
        }

        $this->assertSame(
            [],
            $listedeOlmayan,
            "`down()` gövdesi boş ama listede olmayan göç var.\n\n"
            . "Boş bir `down()` 'geri alındım' der ve hiçbir şey yapmaz; "
            . "`migrate:rollback` sessizce başarılı görünür.\n\n"
            . "Gerçekten geri alınamıyorsa GocGeriAlinabilirligiTest içindeki "
            . "listeye ekleyin; alınabiliyorsa `down()` yazın:\n  "
            . implode("\n  ", $listedeOlmayan),
        );
    }

    public function test_liste_gercekten_geri_alinamayanlari_sayiyor(): void
    {
        // Liste eskirse koruma zayıflar: `down()` yazılmış bir göç listede
        // kalırsa, ileride biri onu boşaltsa kimse fark etmez.
        $govdeler = $this->gocGovdeleri();
        $gereksiz = [];

        foreach (self::GERI_ALINAMAYANLAR as $ad) {
            if (isset($govdeler[$ad]) && $govdeler[$ad] !== '') {
                $gereksiz[] = $ad;
            }
        }

        $this->assertSame(
            [],
            $gereksiz,
            "Bu göçlerin artık `down()` gövdesi var; listeden çıkarılmalı:\n  "
            . implode("\n  ", $gereksiz),
        );
    }
}
