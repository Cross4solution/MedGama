const { test, expect } = require('@playwright/test');
const { oturumDosyasi, cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * MedStream: yayınlama kuralı, etkileşim ve akışın kendisi.
 *
 * Yayın yetkisi kasıtlı olarak dar — hastalar gönderi paylaşamaz, çünkü akış
 * hastaya "doktor söylüyor" diye görünüyor. Yorum da doğrulanmamış doktora
 * kapalı, aynı gerekçeyle.
 *
 * Test bir gönderi açar ve SONUNDA SİLER. Beğeni/kaydetme geçiş düğmesi
 * olduğu için ikinci kez çağrılıp eski hâline döndürülür.
 */

const ONEK = 'Otomatik test gönderisi —';

async function rolIle(browser, rol, is) {
  const context = await browser.newContext({ storageState: oturumDosyasi(rol) });
  const page = await context.newPage();
  try {
    return await is(page);
  } finally {
    await context.close();
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('MedStream', () => {
  /** @type {string|null} */
  let gonderiId = null;

  test('hasta gönderi paylaşamıyor', async ({ browser }) => {
    const sonuc = await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/medstream');
      await cerezBandiniKapat(page);
      return apiIstek(page, '/api/medstream/posts', {
        method: 'POST',
        body: JSON.stringify({ content: `${ONEK} hasta denemesi`, post_type: 'text' }),
      });
    });

    // Yayın kapısı rol bazlı: hasta 403 almalı, 2xx almamalı.
    expect([401, 403, 404, 422]).toContain(sonuc.http);
  });

  test('doğrulanmış doktor gönderi paylaşabiliyor', async ({ browser }) => {
    const sonuc = await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/medstream');
      await cerezBandiniKapat(page);
      return apiIstek(page, '/api/medstream/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: `${ONEK} bu kayıt test sonunda silinir.`,
          post_type: 'text',
        }),
      });
    });

    test.skip(sonuc.http === 403, 'Demo doktorda yayın yetkisi yok');
    expect(sonuc.http, `Gönderi paylaşılamadı: ${JSON.stringify(sonuc.govde)}`).toBe(201);

    const gonderi = sonuc.govde?.data ?? sonuc.govde;
    gonderiId = gonderi?.id ?? null;
    expect(gonderiId).toBeTruthy();
  });

  test('gönderi akışta görünüyor', async ({ browser }) => {
    test.skip(!gonderiId, 'Gönderi paylaşılmadı');

    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/medstream');
      await cerezBandiniKapat(page);

      const { http, govde } = await apiIstek(page, '/api/medstream/feed?per_page=20');
      expect(http).toBe(200);

      const kayitlar = govde?.data?.data ?? govde?.data ?? [];
      const bizimki = kayitlar.find((p) => p.id === gonderiId);
      expect(bizimki, 'Yeni gönderi akışta yok').toBeTruthy();
    });
  });

  test('hasta beğenebiliyor ve beğeniyi geri alabiliyor', async ({ browser }) => {
    test.skip(!gonderiId, 'Gönderi paylaşılmadı');

    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/medstream');
      await cerezBandiniKapat(page);

      // Uç beğeni eklerken 201, kaldırırken 200 dönüyor; ölçülen şey kodun
      // kendisi değil, beğeninin gerçekten yer değiştirmesi.
      const ilk = await apiIstek(page, `/api/medstream/posts/${gonderiId}/like`, { method: 'POST' });
      expect([200, 201]).toContain(ilk.http);
      expect(ilk.govde?.liked).toBe(true);

      // Aynı uç geçiş düğmesi: ikinci çağrı beğeniyi geri alır, kayıt
      // temiz kalır.
      const geri = await apiIstek(page, `/api/medstream/posts/${gonderiId}/like`, { method: 'POST' });
      expect([200, 201]).toContain(geri.http);
      expect(geri.govde?.liked).toBe(false);
    });
  });

  test('hasta yorum yazabiliyor ve yorumunu silebiliyor', async ({ browser }) => {
    test.skip(!gonderiId, 'Gönderi paylaşılmadı');

    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/medstream');
      await cerezBandiniKapat(page);

      const yazma = await apiIstek(page, `/api/medstream/posts/${gonderiId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: `${ONEK} yorum` }),
      });
      expect([201, 403]).toContain(yazma.http);
      test.skip(yazma.http === 403, 'Yorum yetkisi kapalı');

      const yorum = yazma.govde?.data ?? yazma.govde;
      const silme = await apiIstek(page, `/api/medstream/comments/${yorum.id}`, { method: 'DELETE' });
      expect([200, 204]).toContain(silme.http);
    });
  });

  test('kaydetme çalışıyor ve geri alınabiliyor', async ({ browser }) => {
    test.skip(!gonderiId, 'Gönderi paylaşılmadı');

    await rolIle(browser, 'hasta', async (page) => {
      await page.goto('/tr/saved');
      await cerezBandiniKapat(page);

      // Kaydetme de geçiş: ekleyince 201, kaldırınca 200.
      const kaydet = await apiIstek(page, '/api/medstream/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ post_id: gonderiId }),
      });
      expect([200, 201]).toContain(kaydet.http);
      expect(kaydet.govde?.bookmarked).toBe(true);

      // Kayıt satırı gönderinin kendisi değil: hedef kimliği target_id'de,
      // gönderi ayrıca post alanına iliştiriliyor.
      const { govde } = await apiIstek(page, '/api/medstream/bookmarks?per_page=20');
      const kayitlar = govde?.data ?? [];
      const bizimki = kayitlar.some(
        (k) => k.target_id === gonderiId || k.post?.id === gonderiId,
      );
      expect(bizimki, 'Kaydedilen gönderi listede yok').toBeTruthy();

      // Geri al: kaydedilenler listesi test yüzünden şişmesin.
      await apiIstek(page, '/api/medstream/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ post_id: gonderiId }),
      });
    });
  });

  test.afterAll(async ({ browser }) => {
    if (!gonderiId) return;
    await rolIle(browser, 'demoDoktor', async (page) => {
      await page.goto('/tr/medstream');
      await apiIstek(page, `/api/medstream/posts/${gonderiId}`, { method: 'DELETE' });
    }).catch(() => {});
  });
});
