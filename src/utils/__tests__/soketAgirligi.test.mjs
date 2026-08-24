import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Soket yığını ana sayfaya inmemeli.
 *
 * Ölçüldü: `laravel-echo` + `pusher-js` paketlenmiş hâliyle 20 KB gzip
 * (72 KB ham) ve ORTAK KABUK üzerinden her sayfaya iniyordu — hiç oturum
 * açmayacak bir ziyaretçinin ana sayfasına da. Kod hiç çalışmıyordu: iki
 * kullanım yeri de `user?.id` ile korunuyor. Yalnızca ağırlığı taşınıyordu.
 *
 * İki ayrı yol vardı, ikisi de kabukta:
 *
 *   • `Header` → `getEcho()` ile bildirim kanalına abone oluyor. Artık modülü
 *     efektin içinde `import()` ile çağırıyor.
 *   • `NotificationsContext` → yedek yoklama aralığını seçmek için
 *     `Boolean(getEcho())` soruyordu; yani "soket ayarlı mı?" sorusunun cevabı
 *     için tüm yığını indirip bir Echo örneği kuruyordu. Artık ortam
 *     değişkenlerine bakan ağırlıksız `soketAyari.js` kullanıyor.
 *
 * Ana sayfa JS'i 295 → 278 KB gzip. (Ardından İngilizce sözlük de kendi
 * paketine ayrıldı: 278 → 232 KB.)
 *
 * Kaymanın sessiz olduğu için ölçüt var: kabuktaki herhangi bir bileşene
 * eklenecek düz bir `import { getEcho }` satırı ağırlığı sessizce geri getirir.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

/**
 * Ortak kabukta çalışan, yani HER sayfaya inen modüller.
 *
 * Bunların modül grafiği rota koşuluna bakmıyor; buraya giren şey herkese iner.
 */
const KABUK_MODULLERI = [
  'src/components/layout/Header.jsx',
  'src/context/NotificationsContext.jsx',
  'src/context/AuthContext.jsx',
  'app/SiteChrome.jsx',
];

test('kabuktaki modüller soket yığınını statik içe aktarmıyor', () => {
  const suclular = [];

  for (const dosya of KABUK_MODULLERI) {
    const tam = path.join(uygulamaKok, dosya);
    if (!existsSync(tam)) continue;

    for (const satir of readFileSync(tam, 'utf8').split('\n')) {
      // `import('../lib/echo')` (dinamik) serbest; `import … from` değil.
      if (/^\s*import\s[^(]*\bfrom\s+['"][^'"]*lib\/echo/.test(satir)) {
        suclular.push(`${dosya} — ${satir.trim()}`);
      }
    }
  }

  assert.deepEqual(
    suclular,
    [],
    'Kabuktaki bir modül `lib/echo` içe aktarıyor: pusher-js (20 KB gzip)\n'
      + 'oturum açmamış ziyaretçilerin ana sayfasına da iner. Efektin içinde\n'
      + "`import('../lib/echo')` kullanın.",
  );
});

test('soket ayarı modülü soket kütüphanesini çekmiyor', () => {
  // `NotificationsContext` bunu okuyor; ağırlaşırsa düzeltmenin yarısı gider.
  // Dosyanın açıklama yorumu `lib/echo` ifadesini METİN olarak taşıyor (neden
  // ayrıldığını anlatıyor). Ham metinde aramak o yorumu bir ihlal sanıyordu —
  // ölçüt doğru dosyaya karşı kırmızı yandı. Yorumlar ayıklanıyor.
  const kaynak = readFileSync(path.join(uygulamaKok, 'src/lib/soketAyari.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((satir) => !satir.trim().startsWith('//'))
    .join('\n');

  assert.doesNotMatch(kaynak, /from\s+['"](laravel-echo|pusher-js)['"]/, 'ayar modülü soket kütüphanesi çekiyor');
  assert.doesNotMatch(kaynak, /lib\/echo/, 'ayar modülü echo.js çekiyor');
  assert.match(kaynak, /export function soketAyarliMi/, 'soketAyarliMi kaldırılmış');
});

test('derlemede pusher gövdesi ana sayfa grafiğinde değil', (t) => {
  // Asıl ölçüt bu — yukarıdakiler onu koruyan çitler. Derleme yoksa atlanıyor.
  const bildirim = path.join(uygulamaKok, '.next/app-build-manifest.json');
  if (!existsSync(bildirim)) return t.skip('`.next` yok — `npm run build` sonrası çalışır');

  const sayfalar = JSON.parse(readFileSync(bildirim, 'utf8')).pages;
  const anaGraf = [...new Set([
    ...(sayfalar['/[locale]/layout'] || []),
    ...(sayfalar['/[locale]/page'] || []),
  ])].filter((f) => f.endsWith('.js'));

  assert.ok(anaGraf.length > 5, `grafik okunamadı: ${anaGraf.length} dosya`);

  const tasiyanlar = [];
  let toplam = 0;

  for (const f of anaGraf) {
    const s = readFileSync(path.join(uygulamaKok, '.next', f), 'utf8');
    toplam += zlib.gzipSync(s).length;
    // Bu dize yalnız pusher-js gövdesinde geçiyor.
    if (s.includes('pusher:subscribe')) tasiyanlar.push(f);
  }

  assert.deepEqual(tasiyanlar, [], 'pusher gövdesi ana sayfa yığınlarında');

  const kb = Math.round(toplam / 1024);
  assert.ok(kb <= 255, `ana sayfa JS ${kb} KB gzip — 232 KB ölçülmüştü, bütçe 255 KB`);
});
