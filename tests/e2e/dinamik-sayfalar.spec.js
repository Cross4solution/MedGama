const { test, expect } = require('@playwright/test');
const { cerezBandiniKapat, apiIstek } = require('./yardimcilar');

/**
 * Dinamik sayfalar: doktor, klinik, gönderi, profil, tedavi.
 *
 * Geniş tarama yalnızca sabit adresleri geziyordu; "[id]" taşıyanlar dışarıda
 * kalmıştı — oysa ziyaretçinin en çok gördüğü sayfalar tam bunlar. Bir doktor
 * profilinin açılmaması, /about sayfasının açılmamasından çok daha ağır.
 *
 * Kimlikler ÇALIŞMA ANINDA herkese açık uçlardan alınıyor; sabit kimlik
 * yazmak, tohum verisi değiştiği gün testi sessizce anlamsızlaştırıyor.
 *
 * Ölçüt geniş taramayla aynı: çökme, 5xx, boş ekran, ham çeviri anahtarı.
 *
 * VERİ ÜRETMEZ.
 */

const ANAHTAR_KALIBI = /\b[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*){1,4}\b/g;
const YOK_SAY = /\.(com|net|org|tr|io|dev|co|app|json|jsx?|tsx?|png|jpe?g|svg|pdf|css|html?|xml|webp)$/i;

function hamAnahtarlar(metin) {
  const bulunan = new Set();
  for (const parca of metin.match(ANAHTAR_KALIBI) || []) {
    if (YOK_SAY.test(parca) || /^\d/.test(parca)) continue;
    if (!/[a-z][A-Z]/.test(parca)
      && !/^(crm|admin|common|auth|nav|footer|home|patient|doctor|clinic|medstream|telehealth|billing|profile|settings|errors?|validation)\./.test(parca)) continue;
    bulunan.add(parca);
  }
  return [...bulunan];
}

test.describe('Dinamik sayfalar', () => {
  test('ziyaretçinin gördüğü dinamik sayfalar sağlam', async ({ page }) => {
    test.setTimeout(300_000);

    // ── Kimlikleri canlıdan topla ────────────────────────────────
    await page.goto('/tr');
    await cerezBandiniKapat(page);

    const doktorlar = await apiIstek(page, '/api/doctors?per_page=1');
    const klinikler = await apiIstek(page, '/api/clinics?per_page=1');
    const gonderiler = await apiIstek(page, '/api/medstream/posts?per_page=1');
    // Uzmanlıklar "catalog" öneki altında. İlk yazışta /api/specialties
    // denenmişti; o adres 404 döndüğü için uzmanlık sayfaları sessizce
    // sınanmadan kalmıştı.
    const uzmanliklar = await apiIstek(page, '/api/catalog/specialties');

    // Uçlar tek bir zarf kullanmıyor: kimi "data", kimi kendi adını taşıyor
    // ("specialties", "cities"...). Yalnızca "data"ya bakmak uzmanlıkları boş
    // gösterip iki sayfayı sessizce sınanmamış bırakmıştı.
    const ilk = (y) => {
      const g = y.govde;
      if (!g) return null;
      if (Array.isArray(g)) return g[0] ?? null;
      for (const deger of Object.values(g)) {
        if (Array.isArray(deger) && deger.length) return deger[0];
      }
      return null;
    };
    const doktor = ilk(doktorlar);
    const klinik = ilk(klinikler);
    const gonderi = ilk(gonderiler);
    const uzmanlik = ilk(uzmanliklar);

    const hedefler = [];
    const atlanan = [];

    const ekle = (ad, deger, yolYapici) => {
      if (deger) hedefler.push([ad, yolYapici(deger)]);
      else atlanan.push(ad);
    };

    ekle('doktor profili', doktor?.id, (v) => `/tr/doctor/${v}`);
    // Klinikler KISA ADLA adresleniyor; uygulama hiçbir yerde kimlikle
    // bağlantı üretmiyor (kısa ad zorunlu ve benzersiz).
    ekle('klinik sayfası', klinik?.codename, (v) => `/tr/clinic/${v}`);
    ekle('gönderi detayı', gonderi?.id, (v) => `/tr/post/${v}`);
    // Handle, hekim LİSTESİNDE yok — o kaynak `username` alanını hiç
    // döndürmüyor, dolayısıyla bu hedef sessizce atlanıyordu ve kullanıcı
    // profili sayfası hiç sınanmıyordu. Uygulamanın kendisi de handle'ı
    // buradan alıyor: MedStream gönderisi yazarını `@username` ile gösteriyor.
    ekle(
      'kullanıcı profili',
      gonderi?.author?.username || doktor?.codename || doktor?.username,
      (v) => `/tr/${v}`,
    );
    ekle('tedavi/uzmanlık', uzmanlik?.slug || uzmanlik?.code, (v) => `/tr/tedaviler/${v}`);
    ekle('tedavi/uzmanlık/şehir', uzmanlik?.slug || uzmanlik?.code, (v) => `/tr/tedaviler/${v}/istanbul`);

    // Sessiz atlama, kapsanmamışı kapsanmış gösterir.
    if (atlanan.length) {
      console.log(`  ! kimlik bulunamadığı için sınanmayan: ${atlanan.join(', ')}`);
    }
    expect(atlanan, 'Bazı dinamik sayfa türleri için canlıdan kimlik alınamadı').toEqual([]);

    // ── Sırayla gez ──────────────────────────────────────────────
    const sorunlar = [];

    for (const [ad, yol] of hedefler) {
      const cokmeler = [];
      const besYuzler = [];
      const cokmeDinle = (e) => cokmeler.push(String((e && e.message) || e));
      const yanitDinle = (r) => { if (r.status() >= 500) besYuzler.push(`${r.status()} ${new URL(r.url()).pathname}`); };

      page.on('pageerror', cokmeDinle);
      page.on('response', yanitDinle);

      try {
        const yanit = await page.goto(yol, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForTimeout(3500);

        const govde = await page.locator('body').innerText().catch(() => '');
        const uzunluk = govde.trim().length;
        const anahtarlar = hamAnahtarlar(govde);

        if (yanit && yanit.status() >= 400) sorunlar.push(`${ad} (${yol}) → HTTP ${yanit.status()}`);
        if (uzunluk < 40) sorunlar.push(`${ad} (${yol}) → boş ekran (${uzunluk} karakter)`);
        if (cokmeler.length) sorunlar.push(`${ad} (${yol}) → ÇÖKME: ${cokmeler[0]}`);
        if (besYuzler.length) sorunlar.push(`${ad} (${yol}) → 5xx: ${[...new Set(besYuzler)].join(', ')}`);
        if (anahtarlar.length) sorunlar.push(`${ad} (${yol}) → ham anahtar: ${anahtarlar.slice(0, 4).join(', ')}`);

        console.log(`  ${sorunlar.length ? ' ' : '✓'} ${ad.padEnd(22)} ${String(uzunluk).padStart(5)} karakter  ${yol}`);
      } catch (e) {
        sorunlar.push(`${ad} (${yol}) → açılamadı: ${String(e.message || e).split('\n')[0].slice(0, 120)}`);
      } finally {
        page.off('pageerror', cokmeDinle);
        page.off('response', yanitDinle);
      }
    }

    expect(sorunlar, 'Dinamik sayfalarda sorun').toEqual([]);
  });
});
