import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Yer tutuculu bir dizge, değeri geçilmeden çağrılırsa ekrana ham çıkıyor.
 *
 * Bildirimler ekranı "80 {{count}} okunmamış" yazıyordu. Çeviri dizgesi
 * `{{count}} okunmamış` — yani sayıyı KENDİSİ taşıyor. Bileşen hem sayıyı
 * ayrıca basıyor hem de i18next'e değeri hiç vermiyordu, dolayısıyla ikinci
 * yarı olduğu gibi görünüyordu. Aynı anahtarı `Header` doğru çağırıyordu:
 * `t('notifications.unread', { count: unreadCount })`.
 *
 * Aynı tarama ikinci bir sızıntı buldu: CRM randevu ekranı klinik saat dilimini
 * "Saatler klinik saat diliminde ({{tz}})." diye yazıyordu — dokuz dilin
 * hepsinde. Oradaki tuzak farklıydı: çağrının ikinci argümanı, saat dilimi
 * gömülmüş bir şablon dizgesiydi ama i18next onu yalnızca ANAHTAR BULUNAMAZSA
 * kullanır. Anahtar dokuz dilde de vardı, dolayısıyla hazırlanan metin hiç
 * devreye girmiyordu.
 *
 * Sessiz sınıf: uygulama çökmüyor, çeviri "eksik" görünmüyor, yalnız ekranda
 * süslü parantezler duruyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');
const dilKok = path.join(kok, 'src/i18n/locales');

/** Yer tutucu taşıyan bütün anahtarlar (referans dil: tr). */
function yerTutuculuAnahtarlar() {
  const d = JSON.parse(readFileSync(path.join(dilKok, 'tr.json'), 'utf8'));
  const bulunan = new Map();

  const gez = (o, on = '') => {
    for (const [k, v] of Object.entries(o)) {
      const yol = `${on}${k}`;

      if (v && typeof v === 'object') gez(v, `${yol}.`);
      else if (typeof v === 'string' && /\{\{\w+\}\}/.test(v)) bulunan.set(yol, v);
    }
  };

  gez(d);
  return bulunan;
}

function kaynaklar(dizin, biriken = []) {
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name === 'node_modules' || g.name.startsWith('.') || g.name === '__tests__') continue;

    const tam = path.join(dizin, g.name);

    if (g.isDirectory()) kaynaklar(tam, biriken);
    else if (/\.jsx?$/.test(g.name)) biriken.push(tam);
  }
  return biriken;
}

/** `t('anahtar'` çağrısından sonra bir değer nesnesi geliyor mu. */
function degerGecilmis(kuyruk) {
  // İki biçim geçerli: t('k', { ... })  ve  t('k', 'varsayılan', { ... })
  return /^\s*,\s*\{/.test(kuyruk)
    || /^\s*,\s*(['"`])(?:[^\\]|\\.)*?\1\s*,\s*\{/.test(kuyruk);
}

test('referans dilde yer tutuculu anahtar var (tarama boşa dönmüyor)', () => {
  // Ölçüt sessizce hiçbir şey taramaz hâle gelmesin.
  assert.ok(yerTutuculuAnahtarlar().size > 50, 'yer tutuculu anahtar bulunamadı: tarama anlamsız');
});

test('yer tutuculu her çağrı değerini geçiyor', () => {
  const anahtarlar = yerTutuculuAnahtarlar();
  const dosyalar = [...kaynaklar(path.join(kok, 'src')), ...kaynaklar(path.join(kok, 'app'))]
    .filter((f) => !f.includes(`${path.sep}locales${path.sep}`));

  const ihlaller = [];

  for (const f of dosyalar) {
    const kaynak = readFileSync(f, 'utf8');

    for (const anahtar of anahtarlar.keys()) {
      const desen = new RegExp(`\\bt\\(\\s*['"]${anahtar.replace(/\./g, '\\.')}['"]`, 'g');

      for (const m of kaynak.matchAll(desen)) {
        if (degerGecilmis(kaynak.slice(m.index + m[0].length, m.index + m[0].length + 260))) continue;

        const satir = kaynak.slice(0, m.index).split('\n').length;
        ihlaller.push(`${path.relative(kok, f)}:${satir} → ${anahtar}`);
      }
    }
  }

  assert.deepEqual(ihlaller, [], 'yer tutucu ekrana ham çıkacak: çağrı değer geçmiyor');
});
