import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * `api` yanıtı gövdeyi AÇIYOR — çağıran taraf bir kat daha inmemeli.
 *
 *     api.interceptors.response.use((response) => response.data, …)
 *
 * Yani `geoAPI.ipCountry()` doğrudan `{ country, state }` döndürüyor. İki yer
 * bir kat fazla iniyordu:
 *
 *     HomeV2            res?.data?.country     → hep undefined
 *     useLocationPrompt res?.data?.should_ask  → hep undefined
 *
 * İkisi de sessiz: eksik bir süzgeç ve sorulmayan bir soru, çalışan bir
 * sayfadan ayırt edilemiyor. Tarayıcıda ölçüldü — `/geo/ip-country` "TR"
 * döndürürken ana sayfa akışa hiç `country` göndermiyordu.
 *
 * Sayfa listesi gibi uçlarda `res.data` DOĞRU: gövdenin kendisi bir
 * sayfalayıcı (`{ data: [...], total }`). Ölçüt bu yüzden her `res.data`
 * kullanımını değil, yalnız gövdesi düz nesne olan uçları denetliyor.
 *
 * ── İkinci konu: ülke süzgeci akışı boşaltıyordu ──
 *
 * Süzgeç sert (`author.country LIKE %TR%`) ve yazarların ülkesi çoğunlukla boş.
 * Canlıda ölçüldü: `/medstream/posts?per_page=50` 50 gönderi, aynı istek
 * `country=TR` ile SIFIR. Yukarıdaki biçim hatası bunu şimdiye dek gizliyordu —
 * ülke hiç gönderilmediği için süzgeç hiç çalışmıyordu. Biçim hatasını tek
 * başına düzeltmek ana sayfayı boşaltırdı; bu yüzden önizleme, ülkeli istek boş
 * dönerse süzgeçsiz olanı kullanıyor. Niyet korunuyor, boş akış olmuyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklamalar hatalı biçimi METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .join('\n');
}

test('yanıt gövdesi hâlâ açılıyor', () => {
  // Ölçütlerin dayandığı varsayım. Interceptor kaldırılırsa aşağıdaki her şey
  // tersine döner ve bu dosya yanıltıcı hâle gelir.
  const api = yorumsuz(oku('src/lib/api.js'));

  assert.match(
    api,
    /interceptors\.response\.use\(\s*\(response\) => response\.data/,
    'yanıt interceptor\'ı gövdeyi açmıyor — bu dosyadaki tüm ölçütler gözden geçirilmeli',
  );
});

test('düz nesne dönen uçlarda fazladan .data yok', () => {
  // Gövdesi sayfalayıcı OLMAYAN uçlar: `res.data` burada anlamsız.
  const hatalar = [];

  for (const [dosya, desenler] of [
    ['src/screens/HomeV2.jsx', [/res\?\.data\?\.country/]],
    ['src/hooks/useLocationPrompt.js', [/res\?\.data\?\.should_ask/, /res\?\.data\?\.changed/]],
  ]) {
    const kaynak = yorumsuz(oku(dosya));

    for (const desen of desenler) {
      if (desen.test(kaynak)) hatalar.push(`${dosya} → ${desen}`);
    }
  }

  assert.deepEqual(
    hatalar,
    [],
    'Gövde zaten açık; bir kat daha inmek `undefined` verir ve hata sessizdir.',
  );
});

test('ana sayfa ülkeyi doğru alanından okuyor', () => {
  const home = yorumsuz(oku('src/screens/HomeV2.jsx'));

  assert.match(home, /res\?\.country\b/, 'ülke `res.country` alanından okunmuyor');
  assert.match(home, /setGeoCountry\(res\.country\)/, 'okunan ülke duruma yazılmıyor');
});

test('ülke süzgeci akışı boşaltamıyor', () => {
  // Canlıda `country=TR` sıfır gönderi döndürüyor. Süzgeç niyeti korunuyor ama
  // sonucu boş bırakması engelleniyor.
  const onizleme = yorumsuz(oku('src/components/TimelinePreview.jsx'));

  assert.match(onizleme, /country \? await cek\(\{ \.\.\.params, country \}\) : \[\]/, 'ülkeli istek kaldırılmış');
  assert.match(onizleme, /if \(!list\.length\) list = await cek\(params\)/, 'boş sonuçta süzgeçsiz istek denenmiyor');
});

test('geo yanıtını okuyan yeni bir yer eklenmemiş', () => {
  // Aynı hatanın üçüncü kez yapılmasını yakalar: `geoAPI` çağrısının hemen
  // ardındaki satırlarda `res?.data?` görülürse muhtemelen yine bir kat fazla.
  const suclular = [];

  const gez = (dizin) => {
    for (const g of readdirSync(dizin, { withFileTypes: true })) {
      if (g.name === '__tests__' || g.name === 'node_modules') continue;

      const tam = path.join(dizin, g.name);
      if (g.isDirectory()) { gez(tam); continue; }
      if (!/\.jsx?$/.test(g.name)) continue;

      const satirlar = yorumsuz(readFileSync(tam, 'utf8')).split('\n');

      satirlar.forEach((satir, i) => {
        if (!/geoAPI\.\w+\(/.test(satir)) return;

        // Çağrıyı izleyen birkaç satırda fazladan `.data` var mı?
        const pencere = satirlar.slice(i, i + 5).join('\n');
        if (/res\?\.data\?\./.test(pencere)) {
          suclular.push(`${path.relative(uygulamaKok, tam)}:${i + 1}`);
        }
      });
    }
  };

  gez(path.join(uygulamaKok, 'src'));

  assert.deepEqual(suclular, [], 'geo yanıtı yine bir kat fazla iniliyor: sonuç hep undefined olur');
});
