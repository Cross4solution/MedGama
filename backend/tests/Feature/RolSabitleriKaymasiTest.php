<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/**
 * Ön yüzdeki rol sabitleri ile arka uçtaki rol listesi.
 *
 * `src/lib/constants.js` arka ucun rol kimliklerini aynalıyor. Ayrışması
 * SESSİZ: eksik bir rol, o rolü taşıyan kullanıcıyı ekranda yok sayıyor —
 * hata da üretmiyor, çünkü kod "bu rol listede değil" diye sessizce geçiyor.
 *
 * Ölçüldü: liste `hospital` ve `salesperson` rollerini taşımıyordu. Arka uç
 * sekiz rol tanımlıyor (`User::SEVIYELER`), ön yüzdeki beş taneydi.
 *
 * O gün kimse kırılmamıştı çünkü o dosyadan yalnız `getStatusBadge` içe
 * aktarılıyor ve rol listeleri üç ayrı ekranda ayrıca tanımlanmış. Ama adı
 * "constants" olan bir dosyadaki eksik liste tuzak: oradan `CRM_ROLES`
 * alan biri hastane ve satış temsilcisi hesaplarını CRM'den kilitler.
 *
 * Test arka uçta duruyor çünkü rol listesinin tek kaynağı burada.
 */
class RolSabitleriKaymasiTest extends TestCase
{
    private function onYuzSabitleri(): string
    {
        $dosya = base_path('../src/lib/constants.js');

        if (!is_file($dosya)) {
            $this->markTestSkipped('src/lib/constants.js bulunamadı.');
        }

        return file_get_contents($dosya);
    }

    /** Bir `Object.freeze({...})` bloğundaki dizge değerleri. */
    private function blokDegerleri(string $metin, string $ad): array
    {
        $bas = strpos($metin, "export const {$ad} = Object.freeze({");

        if ($bas === false) {
            return [];
        }

        $son = strpos($metin, '});', $bas);
        $govde = substr($metin, $bas, $son - $bas);

        preg_match_all("/:\s*'([^']+)'/", $govde, $eslesme);

        return $eslesme[1];
    }

    public function test_arka_ucun_her_rolu_on_yuzde_taniniyor(): void
    {
        $metin = $this->onYuzSabitleri();
        $onYuz = $this->blokDegerleri($metin, 'ROLES');

        // Tarama çalışmıyorsa test boşuna yeşil olur.
        $this->assertGreaterThan(4, count($onYuz), 'ROLES taraması çalışmıyor');

        $arkaUc = array_keys(User::SEVIYELER);
        $eksik = array_values(array_diff($arkaUc, $onYuz));

        $this->assertSame(
            [],
            $eksik,
            "Arka uçta olan ama `src/lib/constants.js` ROLES içinde OLMAYAN roller:\n  "
            . implode("\n  ", $eksik)
            . "\n\nBu roldeki kullanıcı ön yüzde sessizce tanınmaz.",
        );
    }

    public function test_on_yuzde_uydurma_rol_yok(): void
    {
        // Ters yön: arka uçta karşılığı olmayan bir rol, hiç eşleşmeyecek
        // dallar üretir ve okuyanı yanıltır.
        $onYuz = $this->blokDegerleri($this->onYuzSabitleri(), 'ROLES');
        $fazla = array_values(array_diff($onYuz, array_keys(User::SEVIYELER)));

        $this->assertSame(
            [],
            $fazla,
            'Ön yüzde arka uçta karşılığı olmayan rol: ' . implode(', ', $fazla),
        );
    }

    public function test_crm_rol_listesi_yonlendirmedeki_listeyle_ayni(): void
    {
        // Yönlendirmeyi fiilen `components/crm/CRMPage.jsx` yapıyor. İki liste
        // ayrışırsa `constants`tan okuyan kod, gerçekte CRM'e girebilen bir
        // rolü dışarıda bırakır.
        $sabitler = $this->onYuzSabitleri();
        $sayfaYolu = base_path('../src/components/crm/CRMPage.jsx');

        if (!is_file($sayfaYolu)) {
            $this->markTestSkipped('CRMPage.jsx bulunamadı.');
        }

        preg_match("/export const CRM_ROLES = \[([^\]]+)\]/", file_get_contents($sayfaYolu), $sayfaEslesme);
        preg_match_all("/'([^']+)'/", $sayfaEslesme[1] ?? '', $sayfaRolleri);

        $bas = strpos($sabitler, 'export const CRM_ROLES = [');
        $govde = substr($sabitler, $bas, strpos($sabitler, '];', $bas) - $bas);
        preg_match_all('/ROLES\.([A-Z_]+)/', $govde, $sabitRolleri);

        $rolHaritasi = [];
        foreach ($this->blokDegerleri($sabitler, 'ROLES') as $i => $deger) {
            $rolHaritasi[] = $deger;
        }

        // Sabitlerdeki adları değerlere çevir.
        preg_match_all("/([A-Z_]+):\s*'([^']+)'/", substr($sabitler, strpos($sabitler, 'export const ROLES')), $adDeger);
        $ad2deger = array_combine($adDeger[1], $adDeger[2]);

        $sabitDegerler = array_map(fn ($ad) => $ad2deger[$ad] ?? $ad, $sabitRolleri[1]);

        sort($sabitDegerler);
        $sayfaListesi = $sayfaRolleri[1];
        sort($sayfaListesi);

        $this->assertSame(
            $sayfaListesi,
            $sabitDegerler,
            'constants.js CRM_ROLES ile CRMPage.jsx CRM_ROLES ayrışmış',
        );
    }
}
