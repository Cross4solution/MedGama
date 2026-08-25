import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Yakalanan hatanın biçimi tek: `{ status, code, data, message, errors }`.
 *
 * `src/lib/api.js` içindeki yanıt ara katmanı, axios hatasını olduğu gibi
 * geçirmiyor — kendi düz nesnesiyle reddediyor:
 *
 *     return Promise.reject({ status, code, data, message, errors });
 *
 * Yani `err.response` diye bir şey ASLA yok. Buna rağmen uygulama kodunun
 * yirmi dört dosyasında `err?.response?.status` / `err?.response?.data`
 * okunuyordu. Çoğunda `|| err?.status` yedeği vardı ve o yedek çalışıyordu;
 * yedeği olmayanlar sessizce ölüydü:
 *
 *   • `/crm/branches` 403 alıyordu, ekran durum kodunu okuyamadığı için
 *     "sunucuya ulaşılamadı" diyordu — oysa sorun bağlantı değil yetkiydi.
 *   • `SendMessageModal`, `DoctorBilling`, `MedicalArchive`, `CRMDocuments`,
 *     `AdminCatalog`: arka ucun yazdığı hata mesajı hiç okunmuyor, kullanıcı
 *     her zaman genel metni görüyordu.
 *
 * Bu sınıf sessiz çünkü `?.` zinciri patlamıyor, sadece `undefined` veriyor:
 * kod çalışmaya devam eder, yalnız yanlış dalı seçer.
 *
 * Uygulamada ham axios kullanan başka yer yok (tek `axios.create` api.js'te),
 * dolayısıyla `err.response` okuyan her satır tanım gereği ölüdür.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

/** Yorumsuz kaynak — bu açıklamanın kendisi `err.response` metnini taşıyor. */
const oku = (p) => readFileSync(p, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((satir) => !satir.trim().startsWith('//'))
  .join('\n');

function kaynaklar(dizin, biriken = []) {
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name === 'node_modules' || g.name.startsWith('.')) continue;

    const tam = path.join(dizin, g.name);

    if (g.isDirectory()) kaynaklar(tam, biriken);
    else if (/\.(jsx?|mjs)$/.test(g.name) && statSync(tam).size < 2_000_000) biriken.push(tam);
  }
  return biriken;
}

const uygulamaDosyalari = [
  ...kaynaklar(path.join(kok, 'src')),
  ...kaynaklar(path.join(kok, 'app')),
].filter((f) => !f.endsWith('src/lib/api.js') && !f.includes('__tests__'));

test('ara katman düz nesne reddediyor: `response` sarmalayıcısı yok', () => {
  const api = oku(path.join(kok, 'src/lib/api.js'));

  assert.match(
    api,
    /Promise\.reject\(\{[\s\S]{0,200}status[\s\S]{0,200}\}\)/,
    'api.js artık düz nesne reddetmiyor — bu ölçütün dayanağı değişmiş',
  );
});

test('uygulamada ham axios kullanan başka yer yok', () => {
  // Dayanak bu: tek bir axios örneği varsa, `err.response` okuyan her satır ölü.
  const hamKullanan = uygulamaDosyalari.filter((f) => /from 'axios'/.test(oku(f)));

  assert.deepEqual(
    hamKullanan.map((f) => path.relative(kok, f)),
    [],
    'ham axios kullanan dosya var: hata biçimi varsayımı artık geçerli değil',
  );
});

test('hiçbir ekran ölü `err.response` alanını okumuyor', () => {
  const ihlaller = [];

  for (const f of uygulamaDosyalari) {
    const kaynak = oku(f);

    for (const [i, satir] of kaynak.split('\n').entries()) {
      if (/\.response\s*(\?\.|\.)\s*(status|data)/.test(satir)) {
        ihlaller.push(`${path.relative(kok, f)}:${i + 1}`);
      }
    }
  }

  assert.deepEqual(ihlaller, [], 'hata nesnesinde olmayan `response` alanı okunuyor');
});
