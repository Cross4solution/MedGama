import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Yazı tipi ayarı — ve denenip ÖLÇÜLEREK reddedilen değişiklik.
 *
 * Inter iki alt kümeyle yükleniyor ve ikisi de koşulsuz ön yükleniyor:
 *
 *     latin      47 KB   u+00?? (ç ö ü ä ß … ve ı U+0131)
 *     latin-ext  83 KB   u+0100–02ba … (ğ U+011F, ş U+015F, İ U+0130)
 *
 * Türkçe için ikisi de şart. Ama İngilizce, Almanca ve Arapça sayfalar da
 * latin-ext'i indiriyor — hiçbir karakterini kullanmadan, yalnızca ön yükleme
 * koşulsuz olduğu için.
 *
 * `preload: false` denendi. Bayt gerçekten düşüyor:
 *
 *     /tr  131 → 131 KB      /en  130 → 47 KB
 *     /de  130 →  47 KB      /ar  130 → 47 KB      /ru  130 → 66 KB
 *
 * Ama yavaş 3G'de (400 kbps / 400 ms, üçer ölçüm) yazı tipi GEÇ geliyor, çünkü
 * istek artık CSS ayrıştırılana kadar başlamıyor:
 *
 *     document.fonts.ready    ön yükleme AÇIK   KAPALI
 *     /tr                          7,3 sn       11,0 sn   (+3,7)
 *     /en                          6,3 sn        7,6 sn   (+1,3)
 *
 * Yani Türkçe — birincil pazar — hiç bayt kazanmadan 3,7 saniye daha uzun süre
 * yedek yazı tipiyle duruyor. `display: swap` sayesinde metin hep okunuyor ve
 * `adjustFontFallback` yerleşim kaymasını engelliyor, ama takas kötü.
 *
 * Karar: ön yükleme AÇIK kalıyor.
 *
 * ── Alt kümeye indirme de ölçüldü ve yapılmadı ──
 *
 * İlk tahmin "latin-ext'ten yalnız birkaç harf gerekiyor" idi. Sayıldı: dokuz
 * sözlük ve tüm kaynak kod birlikte 89 ayrı latin-ext karakteri kullanıyor —
 * Türkçe (ğ ş İ ı), Azerice (Ə ə ơ ư), Romence (ș ț), Lehçe (ą ć ł ń ś ź ż),
 * Çekçe (č ď ě ň ř š ť ů ž), Macarca (ő), Baltık (ā ē ī ū), Vietnamca (ỳ ỷ ỹ),
 * Arapça çeviriyazı (ḍ ḥ ṣ ṭ) ve ₺ işareti. Yani "birkaç harf" değil.
 *
 * Asıl engel boyut değil, KULLANICININ YAZDIĞI metin. Doktor ve klinik adları,
 * adresler ve gönderiler bu listede olmayan bir harf içerdiği anda o harf yedek
 * yazı tipinden gelir — aynı kelimenin ortasında gözle görülür bir sıçrama.
 * Sabit bir alt küme, kim kaydolacağını önceden bilmeyi gerektiriyor.
 *
 * Ayrıca `next/font/google` yerine `next/font/local` gerekir: yazı tipi dosyası
 * depoya girer, değişken ağırlık ekseni kaybolabilir ve bakımı birine kalır.
 *
 * Ölçüldü, tartıldı, yapılmadı. Yeniden gündeme gelirse başlangıç noktası bu
 * 89 karakterlik liste ve "yeni bir kullanıcı adı listeyi bozabilir" kısıtı.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

/** Yorumsuz kaynak — açıklama yorumu `preload: false` ifadesini metin olarak taşıyor. */
const layout = readFileSync(path.join(uygulamaKok, 'app/layout.jsx'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((satir) => !satir.trim().startsWith('//'))
  .join('\n');

/** `Inter({ … })` çağrısının gövdesi. */
function fontAyari() {
  const bas = layout.indexOf('Inter({');
  assert.ok(bas > 0, 'app/layout.jsx artık Inter yüklemiyor');

  return layout.slice(bas, layout.indexOf('});', bas));
}

test('yazı tipi ön yüklemesi kapatılmamış', () => {
  // Ölçüldü: kapatmak /tr üzerinde 3,7 saniye geç yazı tipi demek, hem de
  // Türkçe hiç bayt kazanmadan. Ayrıntı yukarıdaki notta.
  assert.doesNotMatch(
    fontAyari(),
    /preload:\s*false/,
    'Ön yükleme kapatılmış: /tr yavaş bağlantıda 3,7 sn daha uzun süre yedek\n'
      + 'yazı tipiyle durur ve Türkçe hiçbir bayt kazanmaz.',
  );
});

test('Türkçe harfleri taşıyan alt küme yükleniyor', () => {
  // `latin-ext` düşerse ğ, ş ve İ yedek yazı tipinden gelir: aynı satırda iki
  // farklı yazı tipi görünür. Sessiz bir bozulma.
  assert.match(fontAyari(), /'latin-ext'/, "latin-ext kaldırılmış: ğ, ş ve İ yedek yazı tipine düşer");
  assert.match(fontAyari(), /'latin'/, 'latin kaldırılmış');
});

test('metin yazı tipi beklerken görünmez olmuyor', () => {
  // `swap` olmazsa yazı tipi inene kadar metin GÖRÜNMEZ (FOIT). Yavaş 3G'de
  // ölçülen süre yedi saniye — yani yedi saniye boş sayfa.
  assert.match(fontAyari(), /display:\s*'swap'/, 'display: swap kaldırılmış: yazı tipi inene kadar metin görünmez');
});
