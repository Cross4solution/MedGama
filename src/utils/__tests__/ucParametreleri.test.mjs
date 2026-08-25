import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Ön yüzün gönderdiği her süzgeci arka uç okumalı.
 *
 * Tanınmayan bir sorgu parametresi sessizce düşer: istek 200 döner, süzgeç hiç
 * uygulanmaz, hiçbir yerde uyarı çıkmaz. İki örneği canlıya kadar gitmişti.
 *
 *   • Klinik arama kutusu `search` gönderiyordu; uç `name` okuyor. Ölçüldü —
 *     "zzzqqqxyz" araması on üç kliniğin hepsini gösteriyordu. Boş kalsaydı
 *     ekran "farklı bir arama deneyin" diyecekti: hiç süzmeyen bir süzgeç için
 *     verilmiş öğüt.
 *
 *   • Doktor listesinde `min_rating` okunuyordu ama sorgu olmayan bir sütuna
 *     bakıyordu (`average_rating`; doğrusu `avg_rating`). SQLite bunu metin
 *     sabiti sayıp her satırı eşliyor, MySQL ise "Unknown column" hatası
 *     veriyordu. Ayrıntısı `backend/tests/Feature/DoktorSuzgecleriTest.php`.
 *
 * İkisinin ortak yanı: parametre adı iki yerde ayrı ayrı yazılı ve ayrışması
 * sessiz. Bu ölçüt iki tarafı da KAYNAKTAN okuyup karşılaştırıyor —
 * `src/lib/api.js` ile çağrı yerleri bir yanda, `routes/api.php` ile
 * denetleyiciler diğer yanda.
 *
 * Kapsam bilinçli olarak dar: yalnız nesne biçiminde parametre verilen GET
 * çağrıları. Konumsal argümanlı çağrılar (`suggestRadius(lat, lon)`) buradan
 * görünmez; onları `yanitBicimi` ölçütü başka açıdan koruyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklamalar parametre adlarını METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//') && !s.trim().startsWith('*'))
    .join('\n');
}

/** `doctorAPI.list` → `{ fiil, yol }`. Nesne bazında ayrıştırılıyor: `list` adı çok yerde var. */
function ucHaritasi() {
  const api = yorumsuz(oku('src/lib/api.js'));
  const harita = new Map();
  const nesneler = [...api.matchAll(/export const (\w+API)\s*=\s*\{/g)];

  nesneler.forEach((nesne, i) => {
    const bas = nesne.index + nesne[0].length;
    const son = i + 1 < nesneler.length ? nesneler[i + 1].index : api.length;

    for (const m of api.slice(bas, son).matchAll(
      /(\w+):\s*\([^)]*\)\s*=>\s*api\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)[`'"]/g,
    )) {
      harita.set(`${nesne[1]}.${m[1]}`, { fiil: m[2].toUpperCase(), yol: m[3] });
    }
  });

  return harita;
}

/**
 * `Route::get('/clinics', [ClinicController::class, 'index'])` → yol → işleyiciler.
 *
 * Yol başına BİR liste tutuluyor, tek kayıt değil: `routes/api.php` içinde aynı
 * yol birden çok kez geçebiliyor, çünkü bir kısmı `Route::prefix('admin')` gibi
 * gruplarda. Gerçek adresleri farklı (`/doctors` ile `/admin/doctors`) ama bu
 * ölçüt grup öneklerini modellemiyor.
 *
 * Bu yüzden "okunuyor mu?" sorusu birleşim üzerinden yanıtlanıyor: aynı yazımı
 * paylaşan işleyicilerden HERHANGİ BİRİ parametreyi okuyorsa yeterli sayılıyor.
 * Ön ekleri ayrıştırmak daha keskin olurdu; şu hâliyle yanlış ALARM vermiyor,
 * yalnızca çok dar bir durumda hata kaçırabilir.
 */
function rotaHaritasi() {
  const rotalar = yorumsuz(oku('backend/routes/api.php'));
  const harita = new Map();

  for (const m of rotalar.matchAll(
    /Route::get\(\s*'([^']+)'\s*,\s*\[(\w+)::class\s*,\s*'(\w+)'\]/g,
  )) {
    const yol = m[1].replace(/^\//, '');
    if (!harita.has(yol)) harita.set(yol, []);
    harita.get(yol).push({ sinif: m[2], metot: m[3] });
  }

  return harita;
}

/** Bir denetleyici metodunun okuduğu istek alanları. */
function okunanlar(sinif, metot) {
  const dosyalar = [];
  const gez = (dizin) => {
    if (!existsSync(dizin)) return;
    for (const g of readdirSync(dizin, { withFileTypes: true })) {
      const tam = path.join(dizin, g.name);
      if (g.isDirectory()) gez(tam);
      else if (g.name === `${sinif}.php`) dosyalar.push(tam);
    }
  };
  gez(path.join(uygulamaKok, 'backend/app/Http/Controllers'));

  if (!dosyalar.length) return null;

  const kaynak = readFileSync(dosyalar[0], 'utf8');
  const bas = kaynak.indexOf(`function ${metot}(`);
  if (bas < 0) return null;

  // Metodun gövdesi: bir sonraki `\n    public function`a kadar.
  const sonraki = kaynak.indexOf('\n    public function', bas + 1);
  let govde = kaynak.slice(bas, sonraki < 0 ? kaynak.length : sonraki);

  // Denetleyicideki sabit süzgeç listeleri (`const SUZGECLER = [...]`) de sayılır.
  for (const sabit of kaynak.matchAll(/const [A-Z_]+ = \[([\s\S]*?)\];/g)) govde += sabit[1];

  const adlar = new Set(['per_page', 'page', 'sort', 'currency', 'year']);

  for (const m of govde.matchAll(/\$request->(\w+)\b/g)) adlar.add(m[1]);
  for (const m of govde.matchAll(/['"](\w+)['"]/g)) adlar.add(m[1]);

  return adlar;
}

/**
 * Bilerek gönderilen, arka ucun görmezden geldiği parametreler.
 *
 * `country`: ülkeye göre klinik süzme arka uçta YOK (`country=ZZ` bile tam
 * listeyi döndürüyor). Satır silinmedi çünkü niyeti kaybetmek istemedik; arka
 * uç desteği gelince bu liste boşalmalı.
 */
const BILINEN_BOSLUKLAR = new Map([['clinics', new Set(['country'])]]);

/** Ön yüzün nesne biçiminde parametre verdiği GET çağrıları. */
function gonderilenler() {
  const uclar = ucHaritasi();
  const bulunan = [];

  const gez = (dizin) => {
    for (const g of readdirSync(dizin, { withFileTypes: true })) {
      if (g.name === '__tests__' || g.name === 'node_modules') continue;

      const tam = path.join(dizin, g.name);
      if (g.isDirectory()) { gez(tam); continue; }
      if (!/\.jsx?$/.test(g.name)) continue;

      const kaynak = yorumsuz(readFileSync(tam, 'utf8'));

      for (const m of kaynak.matchAll(/(\w+API)\.(\w+)\(\{([^}]*)\}/g)) {
        const uc = uclar.get(`${m[1]}.${m[2]}`);
        if (!uc || uc.fiil !== 'GET') continue;

        const anahtarlar = [...m[3].matchAll(/(\w+)\s*:/g)].map((x) => x[1]);
        if (!anahtarlar.length) continue;

        bulunan.push({ yol: uc.yol.replace(/^\//, ''), anahtarlar, dosya: path.relative(uygulamaKok, tam) });
      }
    }
  };

  gez(path.join(uygulamaKok, 'src'));

  return bulunan;
}

test('iki taraf da kaynaktan okunabiliyor', () => {
  // Ayrıştırma bozulursa ölçüt sessizce hiçbir şey denetlemez hâle gelir —
  // aradığı hatayla aynı sessizlik.
  assert.ok(ucHaritasi().size > 100, 'lib/api.js ayrıştırılamadı');
  assert.ok(rotaHaritasi().size > 50, 'routes/api.php ayrıştırılamadı');
  assert.ok(gonderilenler().length >= 8, 'parametre gönderen çağrı bulunamadı');
});

test('gönderilen her süzgeci uç okuyor', () => {
  const rotalar = rotaHaritasi();
  const uyusmayan = [];

  for (const cagri of gonderilenler()) {
    const isleyiciler = rotalar.get(cagri.yol);
    if (!isleyiciler) continue; // dinamik segmentli yollar bu ölçütün dışında

    const okunan = new Set();
    let okunabildi = false;

    for (const isleyici of isleyiciler) {
      const alanlar = okunanlar(isleyici.sinif, isleyici.metot);
      if (!alanlar) continue;

      okunabildi = true;
      for (const a of alanlar) okunan.add(a);
    }

    if (!okunabildi) continue;

    const muaf = BILINEN_BOSLUKLAR.get(cagri.yol) || new Set();
    const adlar = isleyiciler.map((x) => `${x.sinif}::${x.metot}`).join(', ');

    for (const anahtar of cagri.anahtarlar) {
      if (okunan.has(anahtar) || muaf.has(anahtar)) continue;

      uyusmayan.push(`${cagri.dosya} → /${cagri.yol} "${anahtar}" (${adlar})`);
    }
  }

  assert.deepEqual(
    uyusmayan,
    [],
    'Bu parametreleri uç okumuyor. Sessizce düşerler: istek 200 döner, süzgeç\n'
      + 'hiç uygulanmaz. Ya ön yüz yanlış adı gönderiyor ya da uç desteklemiyor.',
  );
});

test('arama kutusu ucun tanıdığı adı gönderiyor', () => {
  // Genel ölçüt bir gün gevşerse bu yine yakalasın: asıl hata buydu.
  const kaynak = yorumsuz(oku('src/screens/BrowseClinics.jsx'));

  assert.match(kaynak, /clinicAPI\.list\(\{[^}]*name: search/, 'arama kutusu `name` göndermiyor');
  assert.doesNotMatch(kaynak, /clinicAPI\.list\(\{[^}]*search: search/, '`search` geri gelmiş: uç onu tanımıyor');
});
