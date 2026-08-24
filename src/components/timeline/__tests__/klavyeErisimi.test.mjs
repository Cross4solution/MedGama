import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Akış kartındaki eylemler klavyeyle de yapılabilmeli.
 *
 * Ölçüldü: akıştaki HİÇBİR video sekmeyle oynatılamıyordu. Kapağın ortasındaki
 * oynat düğmesi düğme değil, bir `div`di; tıklama da kapağın sarmalayıcısında
 * duruyordu. Fareyle sorunsuz çalıştığı için görünmüyordu — kapağın içinde
 * odaklanabilir tek bir öğe yoktu.
 *
 * Aynısı belge gönderilerinde de oldu, ters yönden: kart iç içe düğme
 * ürettiği için sarmal `<button>` kaldırılınca "gönderiyi aç" klavyeye kapandı.
 * İkisi de aynı dersin iki yüzü — tıklanabilir bir `div`, fare olmayan
 * kullanıcı için hiç yok demek.
 *
 * `cursor-pointer` taşıyan her `div` sorun değil: süs katmanları (kapak
 * görseli, karartma, süre etiketi) tıklanabilir GÖRÜNÜR ama eylem kardeş
 * düğmede durur. Bu yüzden test görünüşe değil, eylemin bağlandığı etikete
 * bakıyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const bilesenKok = path.resolve(path.dirname(buDosya), '..');
const kaynakKok = path.resolve(bilesenKok, '../..');

const metin = readFileSync(path.join(bilesenKok, 'TimelineCard.jsx'), 'utf8');

/** Bir işaretçinin geçtiği HER yerin taşıyıcı etiket adını döndürür. */
function eylemiTasiyanEtiketler(isaretci) {
  const etiketler = [];

  for (let yer = metin.indexOf(isaretci); yer !== -1; yer = metin.indexOf(isaretci, yer + 1)) {
    const acilis = metin.lastIndexOf('<', yer);
    etiketler.push(metin.slice(acilis + 1).match(/^[A-Za-z][\w.]*/)?.[0]);
  }

  assert.ok(etiketler.length > 0, `işaretçi bulunamadı: ${isaretci}`);

  return etiketler;
}

test('videoyu oynatma bir düğmeye bağlı', () => {
  // Kapağın sarmalayıcısı da aynı eylemi taşıyor; o fare kolaylığı. Aranan
  // şey, eylemin AYRICA odaklanabilir bir denetime bağlı olması.
  assert.ok(
    eylemiTasiyanEtiketler('onClick={handlePlay}').includes('button'),
    'Oynat denetimi düğme değil: video yalnız fareyle oynatılabilir hâle gelir.',
  );
});

test('oynat düğmesinin okunabilir bir adı var', () => {
  // Düğmenin içinde yalnız bir ikon var; adı olmazsa ekran okuyucu "düğme"
  // diye okur ve neyi oynatacağı belli olmaz.
  assert.match(
    metin,
    /onClick=\{handlePlay\}[\s\S]{0,160}aria-label=\{t\('timelineCard\.playVideo'/,
    'oynat düğmesinin aria-label\'ı kaldırılmış',
  );
});

test('oynatma hatasında yeniden deneme bir düğmeye bağlı', () => {
  assert.ok(
    eylemiTasiyanEtiketler('onClick={() => { setError(false); setPlaying(true); }}').includes('button'),
    'Yeniden deneme tıklanabilir bir div: hata durumundan klavyeyle çıkılamaz.',
  );
});

test('belge kartında gönderiyi açan gerçek bir düğme var', () => {
  // Kart artık `<button>` ile sarılı değil (indirme düğmesi iç içe kalıyordu),
  // o yüzden erişim kartın İÇİNDEN gelmek zorunda.
  const belgeBas = metin.indexOf('function DocumentPreview');
  assert.notEqual(belgeBas, -1, 'DocumentPreview kaldırılmış');

  const belgeSon = metin.indexOf('\nfunction ', belgeBas + 1);
  const govde = metin.slice(belgeBas, belgeSon);

  assert.match(
    govde,
    /<button[^>]*\n?[^>]*onClick=\{onClick\}/,
    'Belge kartında gönderiyi açan odaklanabilir öğe yok: sekmeyle ulaşılamaz.',
  );
});

test('playVideo dokuz dilin hepsinde var', () => {
  // Eksik anahtar sessizdir: i18next yedek metni gösterir, yani Türk kullanıcı
  // ekran okuyucudan İngilizce duyar.
  for (const dil of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'it', 'az']) {
    const sozluk = JSON.parse(readFileSync(path.join(kaynakKok, `i18n/locales/${dil}.json`), 'utf8'));

    assert.ok(
      sozluk.timelineCard?.playVideo,
      `${dil}.json içinde timelineCard.playVideo yok`,
    );
  }
});
