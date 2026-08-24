import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * CRM raporlarının Excel'e aktarımı — sayfa adları.
 *
 * Excel dört şeyi reddediyor ve SheetJS bunları sessizce düzeltmiyor, istisna
 * fırlatıyor. Ölçüldü:
 *
 *     "Göz / Retina"   → Sheet name cannot contain : \ / ? * [ ]
 *     "Rapor [2026]"   → Sheet name cannot contain : \ / ? * [ ]
 *     32 karakter      → Sheet names cannot exceed 31 chars
 *     aynı ad iki kez  → Worksheet with name |Rapor| already exists!
 *
 * Sayfa adları başlıklardan, başlıklar da ÇEVİRİ dosyalarından geliyor. Yani
 * "Gelir / Gider" gibi tek bir çeviri, dışa aktarımın tamamını düşürmeye
 * yetiyor. Üstelik sessizce: çağıran ekranlar hatayı `catch` ile yakalayıp
 * yalnız konsola yazıyor, kullanıcı düğmeye basıyor ve hiçbir şey olmuyor.
 *
 * Bugün dokuz dilin hiçbirinde yasak karakter yok — bu test o durumun kaza
 * eseri değil, korunuyor olması için.
 */

const { sayfaAdi } = await import('../exportUtils.js');
const XLSX = (await import('xlsx')).default ?? (await import('xlsx'));

const buDosya = fileURLToPath(import.meta.url);
const yereller = path.resolve(path.dirname(buDosya), '../../i18n/locales');

test('yasak karakterler temizleniyor', () => {
  // Excel'in reddettiği altı karakter.
  for (const baslik of ['Göz / Retina', 'Rapor [2026]', 'Kayıt*', 'a\\b', 'Ne?', 'Saat: 12']) {
    const ad = sayfaAdi(baslik);

    assert.doesNotMatch(ad, /[:\\/?*[\]]/, `temizlenmemiş: ${baslik} → ${ad}`);
  }
});

test('31 karakter sınırı aşılmıyor', () => {
  const ad = sayfaAdi('Ç'.repeat(60));

  assert.ok(ad.length <= 31, `${ad.length} karakter`);
});

test('aynı başlık iki kez gelince ikinci ad ayrışıyor', () => {
  // Yinelenen ad istisna fırlatıyor; iki tablonun başlığı aynı çeviriye
  // düşebilir.
  const kullanilan = new Set();
  const ilk = sayfaAdi('Gelir Özeti', kullanilan);
  const ikinci = sayfaAdi('Gelir Özeti', kullanilan);

  assert.notEqual(ilk, ikinci);
  assert.ok(ikinci.length <= 31);
});

test('uzun başlıklar aynı yere kırpılsa bile ayrışıyor', () => {
  // Kırpma iki farklı başlığı aynı ada indirebiliyor: asıl tuzak burada.
  const kullanilan = new Set();
  const uzun = 'Aylık Gelir ve Gider Karşılaştırma Tablosu';
  const ilk = sayfaAdi(uzun + ' A', kullanilan);
  const ikinci = sayfaAdi(uzun + ' B', kullanilan);

  assert.notEqual(ilk, ikinci);
  assert.ok(ikinci.length <= 31, `${ikinci.length} karakter`);
});

test('boş başlık bir ada düşüyor', () => {
  // Boş ad da geçerli değil; kitap adsız sayfayla kaydedilemez.
  for (const bos of ['', '   ', null, undefined, '///']) {
    assert.ok(sayfaAdi(bos).trim().length > 0, `boş kaldı: ${JSON.stringify(bos)}`);
  }
});

test('özet sayfası varken tablo adı onunla çakışmıyor', () => {
  // `exportExcel` özet sayfasını 'Summary' adıyla ekliyor. Başlığı da
  // "Summary" olan bir tablo, kitabı düşürürdü.
  const kullanilan = new Set(['Summary']);

  assert.notEqual(sayfaAdi('Summary', kullanilan), 'Summary');
});

test('dokuz dilde de rapor başlıkları Excel için geçerli', () => {
  // Asıl risk çeviride: metin dosyaya girdiği an dışa aktarım kırılıyor ve
  // kimse fark etmiyor. Kırpma zaten yapılıyor, burada karakterlere bakılıyor.
  const anahtarlar = [
    ['crm', 'revenue', 'payoutSummary'],
    ['crm', 'revenue', 'recentInvoices'],
    ['crm', 'revenue', 'reportTitle'],
  ];

  const kusurlu = [];

  for (const dil of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'it', 'az']) {
    const sozluk = JSON.parse(readFileSync(path.join(yereller, `${dil}.json`), 'utf8'));

    for (const yol of anahtarlar) {
      const metin = yol.reduce((o, k) => (o ? o[k] : undefined), sozluk);

      if (typeof metin === 'string' && /[:\\/?*[\]]/.test(metin)) {
        kusurlu.push(`${dil}: ${yol.join('.')} = "${metin}"`);
      }
    }
  }

  assert.deepEqual(
    kusurlu,
    [],
    'Excel sayfa adında kullanılamayan karakter içeren çeviri:\n  ' + kusurlu.join('\n  '),
  );
});

test('temizlenen adları SheetJS gerçekten kabul ediyor', () => {
  // Yukarıdaki testler kuralı benim yazdığım düzenli ifadeye göre ölçüyor.
  // Bu test kuralı KÜTÜPHANEYE soruyor: düşman başlıklarla bir kitap kurup
  // yazmayı deniyor. Kural değişirse ya da bir karakteri kaçırmışsam burada
  // patlar.
  const basliklar = [
    'Göz / Retina',
    'Rapor [2026]',
    'Kayıt*',
    'a\\b',
    'Ne?',
    'Saat: 12',
    'Ç'.repeat(60),
    'Gelir Özeti',
    'Gelir Özeti',
    '',
    '///',
  ];

  const kullanilan = new Set();
  const kitap = XLSX.utils.book_new();

  for (const baslik of basliklar) {
    const sayfa = XLSX.utils.aoa_to_sheet([['a', 'b'], [1, 2]]);
    XLSX.utils.book_append_sheet(kitap, sayfa, sayfaAdi(baslik, kullanilan));
  }

  const tampon = XLSX.write(kitap, { type: 'buffer', bookType: 'xlsx' });

  assert.ok(tampon.length > 0, 'kitap yazılamadı');
  assert.equal(kitap.SheetNames.length, basliklar.length, 'her başlık kendi sayfasını almalı');
});
