const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Dil seçimi ve "içerikler de benim dilimde görünsün" anahtarı.
 *
 * Bu akışta iki hata çıktı ve ikisi de yalnız tarayıcıda görünüyordu:
 *
 * 1. Çevirinin HEDEF dili sunucudaki `preferred_language` kopyasından
 *    alınıyordu. Başlıktaki dil seçici o sütunu hiç yazmıyor, dolayısıyla
 *    Almancaya geçen kullanıcının hedefi `tr` kalıyor ve Türkçe gönderi
 *    Türkçeye "çevriliyordu": metin aynen dönüyor, arayüz Almanca,
 *    gönderiler Türkçe.
 * 2. Anahtar açılıp kendiliğinden kapanıyor diye bildirildi. Arka uç zinciri
 *    (PUT → GET → status) ölçüldü ve doğru çalışıyor; bu paket, aynı akışı
 *    tarayıcıdan geçirerek regresyonu yakalar.
 *
 * Testler kullanıcının tercihini DEĞİŞTİRİYOR; her biri sonunda başladığı
 * durumu geri koyuyor (paketteki "iz bırakma" kuralı).
 */
test.describe('Dil ve içerik çevirisi', () => {
  test.use({ storageState: oturumDosyasi('hasta') });

  /** Sunucudaki güncel çeviri durumu. */
  const durumOku = async (page) => {
    const { govde } = await apiIstek(page, '/api/translation/status');
    return govde?.data ?? govde;
  };

  const anahtar = (page) => page.locator('button[aria-pressed]').first();

  const anahtarDurumu = async (page) =>
    (await anahtar(page).getAttribute('aria-pressed')) === 'true';

  const profileGit = async (page, dil = 'tr') => {
    await page.goto(`/${dil}/profile`);
    await cerezBandiniKapat(page);
    await expect(anahtar(page), 'çeviri anahtarı ekranda yok').toBeVisible({ timeout: 20_000 });
  };

  test('anahtar açık kaldığında sunucuda da açık', async ({ page }) => {
    // Bildirilen şikâyet: "açıyorum sonra kendi kendine kapanıyor."
    // Ölçüt hem ekrandaki durum hem sunucudaki kayıt.
    await profileGit(page);

    const baslangic = await anahtarDurumu(page);

    if (baslangic) {
      await anahtar(page).click();
      await expect.poll(async () => (await durumOku(page))?.enabled, {
        message: 'anahtar kapatıldı ama sunucu hâlâ açık diyor',
        timeout: 15_000,
      }).toBe(false);
    }

    await anahtar(page).click();

    await expect.poll(async () => (await durumOku(page))?.enabled, {
      message: 'anahtar açıldı ama sunucuya yazılmadı',
      timeout: 15_000,
    }).toBe(true);

    // Ekranda da açık kalmalı: sunucuya yazılıp arayüzün geri alması,
    // kullanıcı açısından "kendi kendine kapandı" demektir.
    await expect(anahtar(page)).toHaveAttribute('aria-pressed', 'true');

    // Sayfa yenilendikten sonra da açık olmalı.
    await page.reload();
    await expect(anahtar(page)).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 });

    if (!baslangic) {
      await anahtar(page).click();
    }
  });

  test('anahtar kapatıldığında sunucuda da kapalı', async ({ page }) => {
    await profileGit(page);

    const baslangic = await anahtarDurumu(page);

    if (!baslangic) {
      await anahtar(page).click();
      await expect.poll(async () => (await durumOku(page))?.enabled, { timeout: 15_000 }).toBe(true);
    }

    await anahtar(page).click();

    await expect.poll(async () => (await durumOku(page))?.enabled, {
      message: 'anahtar kapatıldı ama sunucu hâlâ açık diyor',
      timeout: 15_000,
    }).toBe(false);

    if (baslangic) {
      await anahtar(page).click();
    }
  });

  test('dil değişince çeviri hedefi de o dile geçiyor', async ({ page }) => {
    // ASIL REGRESYON. Hedef sunucudaki eski kopyadan gelirse Türkçe gönderi
    // Türkçeye "çevrilir" ve metin aynen döner.
    await profileGit(page, 'tr');

    const { govde: once } = await apiIstek(page, '/api/auth/me');
    const eskiDil = (once?.data ?? once?.user ?? once)?.preferred_language ?? 'tr';

    const almanca = page.getByRole('button', { name: /Deutsch/i }).first();
    await expect(almanca, 'dil seçiminde Almanca yok').toBeVisible({ timeout: 20_000 });
    await almanca.click();

    await expect.poll(async () => (await durumOku(page))?.language, {
      message: 'dil değişti ama çeviri hedefi eski dilde kaldı',
      timeout: 20_000,
    }).toBe('de');

    // Eski dile geri dön (iz bırakma).
    await page.goto(`/${eskiDil}/profile`);
    await cerezBandiniKapat(page);
    const geri = page.getByRole('button', { name: eskiDil === 'tr' ? /Türkçe/i : /English/i }).first();
    if (await geri.isVisible().catch(() => false)) {
      await geri.click();
      await expect.poll(async () => (await durumOku(page))?.language, { timeout: 20_000 }).toBe(eskiDil);
    }
  });

  test('tercih ekranı aynı ucu defalarca sormuyor', async ({ page }) => {
    // Ölçüldü: tek sayfa açılışında `notification-preferences` ucuna beşe
    // yakın GET gidiyordu — iki ayrı bileşen aynı veriyi ayrı ayrı çekiyor.
    // İşlevi bozmuyor ama her profil açılışında boşuna istek üretiyor.
    let sayim = 0;
    page.on('request', (r) => {
      if (r.method() === 'GET' && r.url().includes('/api/auth/profile/notification-preferences')) {
        sayim += 1;
      }
    });

    await profileGit(page);
    await page.waitForTimeout(2_000);

    expect(sayim, `tercih ucu ${sayim} kez soruldu`).toBeLessThanOrEqual(2);
  });
});
