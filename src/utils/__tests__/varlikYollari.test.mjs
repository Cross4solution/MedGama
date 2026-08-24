import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Kaynakta geçen her `public/` yolu diskte durmalı.
 *
 * Kliniğin YAZDIRDIĞI muayene raporunun antetinde `/images/logo.svg` vardı —
 * dosya `/images/logo/logo.svg`. Yani rapor logosuz çıkıyordu ve kimse
 * görmüyordu, çünkü etiketin `onError` işleyicisi görseli gizliyor:
 *
 *     onError={(e) => { e.target.style.display = 'none'; }}
 *
 * Konsolda hata yok, ekranda boşluk yok, yalnızca eksik bir logo. Aynı sınıf
 * daha önce basılan faturada da çıkmıştı: yazdırma çıktısını kimse tarayıcıda
 * gezerken görmüyor.
 *
 * Bu yüzden ölçüt kaynak metnini tarıyor, tarayıcıyı değil.
 *
 * Yalnız düz dizeler denetleniyor: `` `/images/${x}.png` `` gibi çalışma
 * zamanında kurulan yollar zaten burada doğrulanamaz.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');
const acikKok = path.join(uygulamaKok, 'public');

/**
 * Taranmayan dosyalar ve nedeni.
 *
 * Bu ikisi hiçbir yerden içe aktarılmıyor — akış geliştirilirken kullanılmış
 * sahte veri. İçlerindeki görsel yolları da diskte yok, ama kod ölü olduğu için
 * bu bir hata değil. Dosyalar silinirse bu liste de boşalmalı.
 */
const TARANMAYAN = new Set([
  'src/components/timeline/feedMock.js',
  'src/components/timelineData.js',
]);

/** Taranacak kaynak dosyalar. */
function kaynaklar(dizin, toplam = []) {
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name === 'node_modules' || g.name === '.next' || g.name === '__tests__') continue;

    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) kaynaklar(tam, toplam);
    else if (/\.(jsx?|tsx?)$/.test(g.name)) toplam.push(tam);
  }

  return toplam;
}

/**
 * Düz dize olarak yazılmış `public/` yolları.
 *
 * Tırnak içinde başlayıp biten, `${` içermeyen yollar. Sondaki tırnak şart:
 * aksi hâlde bir şablon dizesinin sabit ön eki tam yol sanılır.
 */
function yollar(metin) {
  return [...metin.matchAll(/['"](\/(?:images|fonts|icons|assets|videos)\/[^'"${}\s]+)['"]/g)]
    .map((m) => m[1]);
}

test('kaynakta geçen her varlık yolu diskte var', () => {
  const dosyalar = [
    ...kaynaklar(path.join(uygulamaKok, 'src')),
    ...kaynaklar(path.join(uygulamaKok, 'app')),
  ];

  assert.ok(dosyalar.length > 100, `tarama çalışmıyor: ${dosyalar.length} dosya`);

  const eksik = [];

  for (const dosya of dosyalar) {
    // Yorumlar ayıklanıyor: `resolveStorageUrl.js` içindeki bir açıklama satırı
    // örnek olarak `"/images/..."` yazıyor ve ham metinde arayan ölçüt onu
    // gerçek bir yol sanıyordu. (Aynı tuzağa bu çalışmada dördüncü düşüş.)
    if (TARANMAYAN.has(path.relative(uygulamaKok, dosya))) continue;

    const metin = readFileSync(dosya, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((satir) => !satir.trim().startsWith('//'))
      .join('\n');

    for (const yol of yollar(metin)) {
      // Sorgu dizesi ve çapa varlığın parçası değil.
      const temiz = yol.split('?')[0].split('#')[0];
      if (existsSync(path.join(acikKok, temiz))) continue;

      eksik.push(`${path.relative(uygulamaKok, dosya)} → ${yol}`);
    }
  }

  assert.deepEqual(
    [...new Set(eksik)].sort(),
    [],
    'Kaynak, `public/` altında olmayan bir dosyaya işaret ediyor. Görsel\n'
      + 'yüklenmez; `onError` ile gizleniyorsa hiç belli olmaz (yazdırma\n'
      + 'çıktısında tam olarak bu oldu).',
  );
});

test('logo yeniden şişmemiş', () => {
  // İllüstratör çıktısı altı ondalıklı sayılarla geliyordu: 66 KB ham,
  // 20,7 KB gzip. Hassasiyet bir ondalığa indirildi — 36 KB ham, 10,4 KB gzip,
  // ölçülen görsel fark piksel başına ortalama %0,032 (ekranda 176 piksel
  // genişliğinde duran bir logoda görünmez).
  //
  // Logo her sayfada var; yeniden dışa aktarılıp üzerine yazılması kolay.
  const kb = readFileSync(path.join(acikKok, 'images/logo/logo.svg'), 'utf8').length / 1024;

  assert.ok(kb <= 45, `logo.svg ${Math.round(kb)} KB — hassasiyeti düşürülmüş hâli 36 KB idi`);
});
