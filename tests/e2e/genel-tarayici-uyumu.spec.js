const { test, expect } = require('@playwright/test');
const { cerezBandiniKapat } = require('./yardimcilar');

/**
 * Üç motorda da çalışması gerekenler — Chrome, Safari, Firefox.
 *
 * Buradaki her ölçüt bu oturumda değiştirilmiş bir şeyi sınıyor ve hepsi
 * motordan motora değişebilecek cinsten: yazı yönü, odak yönetimi, yerleşim
 * taşması, HTTP durum kodu.
 *
 * Dosya adı `genel-` ile başlıyor çünkü Safari ve Firefox projeleri yalnız o
 * öneke bakıyor: oturum kurulumu parolayla giriş yapıyor ve her motor için ayrı
 * bir giriş turu arka ucun hız sınırını tetikliyor (ölçüldü: 429). Oturum
 * gerektiren her şey chromium'da kalıyor.
 */

const HERKESE_ACIK = ['/tr', '/tr/about', '/tr/for-patients', '/tr/kvkk'];

test.describe('Tarayıcı uyumu', () => {
  test('sayfalar yatay taşmıyor (telefon genişliği)', async ({ page }) => {
    // Taşma en çok motora göre değişen şey: kaydırma çubuğu genişliği, esnek
    // kutu yuvarlaması ve yazı tipi ölçüleri motorlar arasında farklı.
    await page.setViewportSize({ width: 375, height: 812 });

    for (const yol of HERKESE_ACIK) {
      await page.goto(yol);
      await cerezBandiniKapat(page);
      await page.waitForTimeout(800);

      const tasma = await page.evaluate(() => {
        const k = document.documentElement;
        return k.scrollWidth - k.clientWidth;
      });

      expect(tasma, `${yol} — yatay taşma`).toBeLessThanOrEqual(1);
    }
  });

  test('içeriğe geç bağlantısı ilk sırada ve hedefi var', async ({ page, browserName }) => {
    // Odak sırası ve `tabIndex={-1}` ile odaklanabilir `<main>`: ikisi de
    // motora göre farklı davranabiliyor.
    await page.goto('/tr');
    await cerezBandiniKapat(page);

    const atlama = page.locator('a[href="#icerik"]');
    await expect(atlama, 'atlama bağlantısı yok').toHaveCount(1);

    const ana = page.locator('main#icerik');
    await expect(ana, 'ana içerik alanı yok').toHaveCount(1);
    await expect(ana).toHaveAttribute('tabindex', '-1');

    // Sekme sırasının başında mı?
    //
    // Safari'de Tab varsayılan olarak BAĞLANTILARA uğramıyor, yalnız form
    // denetimleri arasında geziniyor (macOS'ta "Tab ile her ögeyi vurgula"
    // kapalı gelir). Bu bir platform davranışı, uygulama kusuru değil — o
    // yüzden sekme sırası yalnız bağlantıları odaklayan motorlarda ölçülüyor.

    // Ölçümün ön koşulu AÇIKÇA kuruluyor: odak belgenin başında olmalı.
    // Çerez bandını kapatmak bir düğmeye tıklıyor ve düğme kaldırılınca odak
    // gövdeye düşüyor — ama bant hâlâ çıkış animasyonundayken ilk Tab başka
    // bir yere gidebiliyordu. Test tam koşuda kararsızdı, tek başına
    // geçiyordu; sebebi uygulama değil, varsayılan bir ön koşuldu.
    await expect(page.locator('a[href="#icerik"]')).toBeVisible();
    await page.evaluate(() => {
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
    });

    await page.keyboard.press('Tab');
    const ilkOdak = await page.evaluate(() => document.activeElement?.getAttribute('href'));

    if (browserName === 'webkit') {
      // Safari'de aranan şey, bağlantının programlı olarak odaklanabilmesi:
      // ekran okuyucular ve klavye ayarı açık kullanıcılar oraya ulaşıyor.
      const odaklandi = await page.evaluate(() => {
        const a = document.querySelector('a[href="#icerik"]');
        a?.focus();
        return document.activeElement === a;
      });
      expect(odaklandi, 'atlama bağlantısı odak alamıyor').toBe(true);
    } else {
      expect(ilkOdak, 'ilk sekme atlama bağlantısına gitmiyor').toBe('#icerik');
    }
  });

  test('arapça sağdan sola render ediliyor', async ({ page }) => {
    await page.goto('/ar');
    await cerezBandiniKapat(page);

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    const tasma = await page.evaluate(() => {
      const k = document.documentElement;
      return k.scrollWidth - k.clientWidth;
    });
    expect(tasma, 'RTL yerleşiminde yatay taşma').toBeLessThanOrEqual(1);
  });

  test('olmayan adres 404 dönüyor', async ({ page }) => {
    // Durum kodu motordan bağımsız olmalı ama yanıtın akış biçimi değişiyor;
    // bu ölçüt onun için burada.
    const yanit = await page.goto('/tr/kesinlikle-olmayan-bir-sayfa');

    expect(yanit?.status(), 'olmayan sayfa 404 dönmüyor').toBe(404);

    // 404 arayüzü akışın ilerisinde geliyor: gövdeye hemen bakmak yalnız
    // başlığı görüyor. Beklemeli ölçüt kullanılıyor.
    await expect(
      page.getByText(/404|Sayfa Bulunamadı/i).first(),
      '404 ekranı görünmüyor',
    ).toBeVisible({ timeout: 15_000 });
  });

  test('görsellerin alt metni var', async ({ page }) => {
    await page.goto('/tr');
    await cerezBandiniKapat(page);
    await page.waitForTimeout(1200);

    const altsiz = await page.evaluate(() => [...document.querySelectorAll('img')]
      .filter((g) => g.offsetParent !== null && !g.hasAttribute('alt'))
      .map((g) => (g.currentSrc || g.src || '').slice(-50)));

    expect(altsiz, 'alt metni olmayan görsel').toEqual([]);
  });
});
