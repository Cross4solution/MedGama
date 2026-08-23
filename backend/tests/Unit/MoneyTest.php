<?php

namespace Tests\Unit;

use App\Support\Money;
use PHPUnit\Framework\TestCase;

/**
 * Para aritmetiği — kuruş cinsinden tam sayı, float değil.
 *
 * Sınıfın var oluş sebebi float'ın parayı kaydırması: 0.1 + 0.2 kayan
 * noktada 0.30000000000000004 eder ve her işlemde bir kuruş kaybolur ya da
 * fazladan kesilir. Hata sessizdir — fatura görünür, sadece tutarı yanlıştır.
 *
 * Burası birim testi: veritabanı gerekmiyor, aritmetik doğrudan sınanıyor.
 * Ödeme akışının kendisi PaymentTest'te.
 */
class MoneyTest extends TestCase
{
    // ── Ondalıktan kuruşa ──

    public function test_ondalik_kurusa_dogru_ceviriliyor(): void
    {
        $this->assertSame(12050, Money::fromDecimal('120.50', 'EUR')->minor);
        $this->assertSame(12050, Money::fromDecimal(120.5, 'EUR')->minor);
        $this->assertSame(100, Money::fromDecimal(1, 'EUR')->minor);
    }

    public function test_kayan_nokta_kaymasi_kurusa_yansimiyor(): void
    {
        // Klasik tuzak: 0.1 + 0.2 float'ta 0.30000000000000004.
        $toplam = Money::fromDecimal(0.1, 'TRY')->plus(Money::fromDecimal(0.2, 'TRY'));

        $this->assertSame(30, $toplam->minor, 'kayan nokta hatası kuruşa sızdı');
    }

    public function test_ucuncu_ondalik_yuvarlaniyor(): void
    {
        // Kullanıcı ya da dış servis üç ondalık gönderebiliyor.
        $this->assertSame(1999, Money::fromDecimal('19.994', 'TRY')->minor);
        $this->assertSame(2000, Money::fromDecimal('19.995', 'TRY')->minor);
    }

    public function test_kurussuz_para_birimi_yuz_katina_cikmiyor(): void
    {
        // JPY'de alt birim yok. 100 katına çıkarılırsa fatura yüz kat şişer —
        // sessiz ve çok pahalı bir hata.
        $yen = Money::fromDecimal('5000', 'JPY');

        $this->assertSame(5000, $yen->minor, 'kuruşsuz para birimi 100 ile çarpıldı');
        $this->assertSame('5000', $yen->toDecimalString());
    }

    public function test_para_birimi_buyuk_harfe_normalleniyor(): void
    {
        // 'try' ile 'TRY' aynı para birimi; ayrışırsa toplama reddedilir.
        $this->assertSame('TRY', Money::of(100, 'try')->currency);
        Money::of(100, 'try')->plus(Money::of(100, 'TRY'));
        $this->addToAssertionCount(1);
    }

    // ── Toplama / çıkarma ──

    public function test_farkli_para_birimleri_toplanamiyor(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        Money::of(100, 'EUR')->plus(Money::of(100, 'TRY'));
    }

    public function test_negatif_tutar_uretilemiyor(): void
    {
        // Negatif bir tutar ciroyu aşağı çeker ve toplamlarda başka
        // faturaların gelirini yer.
        $this->expectException(\InvalidArgumentException::class);

        Money::of(100, 'TRY')->minus(Money::of(300, 'TRY'));
    }

    public function test_tam_odemede_kalan_sifir(): void
    {
        $kalan = Money::of(30000, 'TRY')->minus(Money::of(30000, 'TRY'));

        $this->assertTrue($kalan->isZero());
    }

    // ── Komisyon ──

    public function test_komisyon_kalan_kurusu_klinige_birakiyor(): void
    {
        // Platform kendi lehine yuvarlarsa her işlemde bir kuruş fazla keser.
        // Tek işlemde önemsiz, milyon işlemde on bin lira.
        ['komisyon' => $k, 'hakedis' => $h] = Money::of(10001, 'TRY')->komisyonAyir(0.15);

        $this->assertSame(1500, $k->minor, 'komisyon yukarı yuvarlandı');
        $this->assertSame(8501, $h->minor);
    }

    public function test_komisyon_ve_hakedis_toplami_tutari_veriyor(): void
    {
        // Asıl değişmez: bölme sırasında kuruş kaybolmamalı.
        foreach ([1, 7, 99, 10001, 123457] as $tutar) {
            foreach ([0.0, 0.03, 0.15, 0.5, 1.0] as $oran) {
                ['komisyon' => $k, 'hakedis' => $h] = Money::of($tutar, 'TRY')->komisyonAyir($oran);

                $this->assertSame(
                    $tutar,
                    $k->minor + $h->minor,
                    "kuruş kayboldu: tutar={$tutar} oran={$oran}",
                );
            }
        }
    }

    public function test_sifir_komisyonda_tamami_klinige_gidiyor(): void
    {
        ['komisyon' => $k, 'hakedis' => $h] = Money::of(5000, 'TRY')->komisyonAyir(0.0);

        $this->assertSame(0, $k->minor);
        $this->assertSame(5000, $h->minor);
    }

    public function test_gecersiz_komisyon_orani_reddediliyor(): void
    {
        // 1'in üstünde bir oran hekime negatif hakediş bırakırdı.
        $this->expectException(\InvalidArgumentException::class);

        Money::of(5000, 'TRY')->komisyonAyir(1.5);
    }

    public function test_negatif_komisyon_orani_reddediliyor(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        Money::of(5000, 'TRY')->komisyonAyir(-0.1);
    }

    // ── Gösterim ──

    public function test_ondalik_gosterim_turkce_bicimde(): void
    {
        // GÖSTERİM biçimi: ondalık ayırıcı virgül, binlik nokta.
        //
        // UYARI — bu dizge MAKİNEYE VERİLEMEZ. "1.234,56" bir ödeme
        // sağlayıcısına ya da JSON tüketicisine gittiğinde `parseFloat`
        // 1.234 okur, yani tutar bin katı küçülür. Makine tarafı için
        // `minor` (kuruş tam sayısı) kullanılmalı.
        //
        // Bugün `toDecimalString()` ve `toArray()['display']` hiçbir yerde
        // TÜKETİLMİYOR — ölçüldü, ne arka uçta ne ön yüzde çağrılıyor.
        // O yüzden biçim seçimi şu an taşıyıcı değil; kullanılmaya
        // başlandığında bu not karar noktası olsun diye duruyor.
        $this->assertSame('120,50', Money::of(12050, 'TRY')->toDecimalString());
        $this->assertSame('0,05', Money::of(5, 'TRY')->toDecimalString());
        $this->assertSame('1.234,56', Money::of(123456, 'TRY')->toDecimalString());
    }

    public function test_esitlik_para_birimini_de_karsilastiriyor(): void
    {
        $this->assertTrue(Money::of(100, 'TRY')->equals(Money::of(100, 'TRY')));
        $this->assertFalse(Money::of(100, 'TRY')->equals(Money::of(100, 'EUR')));
    }
}
