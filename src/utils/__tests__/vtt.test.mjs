import test from 'node:test';
import assert from 'node:assert/strict';
import { zamaniSaniyeyeCevir, saniyeyiZamanaCevir, vttCozumle, vttUret } from '../../lib/vtt.js';

/**
 * WebVTT okuma/yazma — telesağlık alt yazısı.
 *
 * Bu dosya hiç sınanmamıştı. Taşıdığı şey hasta ile hekimin GÖRÜŞME KAYDI:
 * düzeltme ekranında okunuyor, düzeltiliyor ve tekrar yazılıyor. Bir tur
 * kaybı burada tıbbi bir cümlenin kaybolması demek.
 *
 * Sessiz kırılma yolları:
 *  • Zaman biçimi bozulursa alt yazı kayar — metin doğru, anı yanlış.
 *  • Gidiş-dönüş kayıplıysa her düzenlemede biraz daha bozulur.
 *  • Bozuk girdi istisna atarsa düzeltme ekranı hiç açılmaz.
 */

test('zaman metni saniyeye çevriliyor', () => {
  assert.equal(zamaniSaniyeyeCevir('00:01:02.500'), 62.5);
  assert.equal(zamaniSaniyeyeCevir('01:00:00.000'), 3600);
  assert.equal(zamaniSaniyeyeCevir('00:00.250'), 0.25);
});

test('virgüllü ondalık da kabul ediliyor', () => {
  // SRT'den gelen kayıtlarda ondalık ayırıcı virgül olabiliyor.
  assert.equal(zamaniSaniyeyeCevir('00:01:02,500'), 62.5);
});

test('saniye zaman metnine çevriliyor', () => {
  assert.equal(saniyeyiZamanaCevir(62.5), '00:01:02.500');
  assert.equal(saniyeyiZamanaCevir(3600), '01:00:00.000');
  assert.equal(saniyeyiZamanaCevir(0), '00:00:00.000');
});

test('negatif ve geçersiz süre sıfıra çekiliyor', () => {
  // Negatif bir başlangıç oynatıcıyı kırar.
  assert.equal(saniyeyiZamanaCevir(-5), '00:00:00.000');
  assert.equal(saniyeyiZamanaCevir(NaN), '00:00:00.000');
  assert.equal(saniyeyiZamanaCevir(undefined), '00:00:00.000');
});

test('zaman çevrimi gidiş-dönüşte korunuyor', () => {
  for (const saniye of [0, 1.5, 62.5, 599.999, 3661.25]) {
    assert.equal(
      zamaniSaniyeyeCevir(saniyeyiZamanaCevir(saniye)),
      Number(saniye.toFixed(3)),
      `gidiş-dönüş kaybı: ${saniye}`,
    );
  }
});

test('WebVTT çözümleniyor', () => {
  const vtt = [
    'WEBVTT',
    '',
    '1',
    '00:00:00.000 --> 00:00:02.000',
    'Merhaba, nasılsınız?',
    '',
    '2',
    '00:00:02.000 --> 00:00:05.500',
    'Şikâyetiniz ne zaman başladı?',
    '',
  ].join('\n');

  const parcalar = vttCozumle(vtt);

  assert.equal(parcalar.length, 2);
  assert.deepEqual(parcalar[0], { start: 0, end: 2, text: 'Merhaba, nasılsınız?' });
  assert.equal(parcalar[1].end, 5.5);
});

test('NOTE blokları ve sıra numaraları metne karışmıyor', () => {
  const vtt = [
    'WEBVTT',
    '',
    'NOTE Bu bir açıklama satırı',
    '',
    '7',
    '00:00:01.000 --> 00:00:02.000',
    'Gerçek metin',
    '',
  ].join('\n');

  const parcalar = vttCozumle(vtt);

  assert.equal(parcalar.length, 1);
  assert.equal(parcalar[0].text, 'Gerçek metin');
});

test('çok satırlı alt yazı birleştiriliyor', () => {
  const vtt = 'WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nBirinci satır\nİkinci satır\n';

  assert.equal(vttCozumle(vtt)[0].text, 'Birinci satır\nİkinci satır');
});

test('bitiş zamanındaki konum ayarları göz ardı ediliyor', () => {
  // Gerçek dosyalarda "00:00:02.000 line:90% align:middle" görülüyor.
  const vtt = 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000 line:90% align:middle\nMetin\n';

  assert.equal(vttCozumle(vtt)[0].end, 2);
});

test('bozuk girdi istisna atmıyor', () => {
  // Düzeltme ekranı bozuk bir dosyada hiç açılmamalı değil, boş açılmalı.
  for (const girdi of ['', null, undefined, 'saçma sapan metin', 'WEBVTT', '-->', '\n\n\n']) {
    assert.doesNotThrow(() => vttCozumle(girdi), `çöktü: ${String(girdi)}`);
    assert.ok(Array.isArray(vttCozumle(girdi)));
  }
});

test('boş metinli satırlar atılıyor', () => {
  const vtt = 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n\n\n00:00:01.000 --> 00:00:02.000\nDolu\n';

  const parcalar = vttCozumle(vtt);

  assert.equal(parcalar.length, 1);
  assert.equal(parcalar[0].text, 'Dolu');
});

test('üretilen dosya yeniden çözümlendiğinde aynı kalıyor', () => {
  // ASIL ÖLÇÜT: düzeltme ekranı okuyor, yazıyor, tekrar okuyor. Kayıplıysa
  // her turda alt yazı biraz daha bozulur.
  const parcalar = [
    { start: 0, end: 2.5, text: 'Merhaba' },
    { start: 2.5, end: 6, text: 'Şikâyetiniz\nne zaman başladı?' },
  ];

  assert.deepEqual(vttCozumle(vttUret(parcalar)), parcalar);
});

test('metin içinde ok işareti geçerse dosya bozulmuyor', () => {
  // Hekim "A --> B" diyebilir. `-->` zaman satırının ayracı olduğu için
  // ham hâliyle yazılırsa dosya yeniden okunduğunda o satır ZAMAN satırı
  // sanılır: metin kaybolur ve alt yazı kayar.
  const parcalar = [{ start: 0, end: 3, text: 'Ağrı sırttan --> bacağa yayılıyor' }];

  const tekrar = vttCozumle(vttUret(parcalar));

  assert.equal(tekrar.length, 1, 'ok işareti satırı böldü');
  assert.equal(tekrar[0].text, 'Ağrı sırttan --> bacağa yayılıyor');
  assert.equal(tekrar[0].start, 0);
  assert.equal(tekrar[0].end, 3);
});
