import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Akıştaki görseller Next'in iyileştiricisinden geçmeli.
 *
 * Ölçüldü: akıştaki bir Unsplash fotoğrafı ham hâliyle 134 KB iniyor. Aynı
 * görsel iyileştiriciden 640 piksel genişlikte 20 KB (webp) geliyor — %85 az.
 *
 * İzin listesi (`next.config.js` → `remotePatterns`) zaten kuruluydu, yani
 * iyileştirici hazırdı; akış kartları düz bir `<img>` kullandığı için hiç
 * uğramıyorlardı. Yavaş 3G'de ana sayfa ölçümü: 1267→1067 KB, görseller
 * 728→528 KB, tam yük 29,4→25,4 saniye.
 *
 * İki tuzak, ikisi de sessiz:
 *
 *   • SVG iyileştiriciye verilirse 400 döner. `dangerouslyAllowSVG` bilerek
 *     kapalı çünkü SVG betik taşıyabilir.
 *   • İzin listesinde olmayan bir köken de 400 döner. Eski davranış hatada
 *     görseli TÜMÜYLE gizlemekti; iyileştirici üzerinden geçerken bu, bir
 *     kökenin listeye eklenmesi unutulduğunda görsellerin sessizce yok olması
 *     demek olurdu. O yüzden önce ham adrese düşülüyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const bilesenKok = path.resolve(path.dirname(buDosya), '..');
const uygulamaKok = path.resolve(bilesenKok, '../../..');

const kart = readFileSync(path.join(bilesenKok, 'TimelineCard.jsx'), 'utf8');
const yapilandirmaHam = readFileSync(path.join(uygulamaKok, 'next.config.js'), 'utf8');

/**
 * Yorumsuz yapılandırma.
 *
 * Dosyadaki uyarı yorumu `hostname: '**'` ifadesini METİN olarak taşıyor
 * (eskiden öyleymiş, bir daha yazılmasın diye). Ham metinde arama yapmak o
 * yorumu bir ihlal sanıyordu — test doğru yapılandırmaya karşı kırmızı yandı.
 */
const yapilandirma = yapilandirmaHam
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((satir) => !satir.trim().startsWith('//'))
  .join('\n');

test('akış görselleri iyileştirici adresini kullanıyor', () => {
  assert.match(kart, /\/_next\/image\?url=/, 'görseller ham adresle iniyor: sayfa gereksiz ağırlıyor');
  assert.match(kart, /srcSet=/, 'srcSet yok: her ekrana aynı büyüklük gönderiliyor');
  assert.match(kart, /sizes=/, 'sizes yok: tarayıcı hangi genişliği seçeceğini bilmiyor');
});

test('SVG iyileştiriciye gönderilmiyor', () => {
  // `dangerouslyAllowSVG: false` olduğu için iyileştirici SVG'yi reddediyor.
  assert.match(
    kart,
    /\\.svg\(\\\?\|\$\)/,
    'SVG ayıklanmıyor: varsayılan avatar gibi SVG görseller 400 alır',
  );
  assert.match(yapilandirma, /dangerouslyAllowSVG:\s*false/, 'SVG iyileştirmesi açılmış: XSS yüzeyi');
});

test('iyileştirici reddederse ham adrese düşülüyor', () => {
  // Aksi hâlde izin listesine eklenmeyen bir köken, görsellerin sessizce
  // kaybolmasına yol açar — eski davranış hatada tümüyle gizlemekti.
  assert.match(kart, /hamaDus/, 'ham adrese düşme yolu yok');
  assert.match(
    kart,
    /onError=\{\(\) => \(optimize \? setHamaDus\(true\) : setHata\(true\)\)\}/,
    'hata yolu önce ham adresi denemiyor',
  );
});

test('izin listesi joker içermiyor', () => {
  // `hostname: '**'` her siteyi bizim alan adımız üzerinden dağıtılabilir
  // kılıyordu; canlıda doğrulanmış bir olaydı.
  assert.doesNotMatch(yapilandirma, /hostname:\s*['"]\*\*['"]/, 'izin listesinde joker köken var');
  assert.match(yapilandirma, /images\.unsplash\.com/, 'akış görsellerinin kökeni listede değil');
});

test('istenen genişlikler Next\'in kabul ettiği ölçülerden', () => {
  // Listede olmayan bir genişlik 400 döner. Bunlar varsayılan `deviceSizes`.
  const genislikler = kart.match(/const GORSEL_GENISLIKLERI = \[([^\]]+)\]/);

  assert.ok(genislikler, 'genişlik listesi bulunamadı');

  const izinli = new Set([640, 750, 828, 1080, 1200, 1920, 2048, 3840]);
  const kullanilan = genislikler[1].split(',').map((x) => Number(x.trim()));

  for (const g of kullanilan) {
    assert.ok(izinli.has(g), `${g} Next'in varsayılan ölçüleri arasında değil: 400 döner`);
  }
});
