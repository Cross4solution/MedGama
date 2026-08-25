import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import doktorAdi from '../doktorAdi.js';

/**
 * Unvan iki kez yazılmamalı.
 *
 * Veride iki biçim bir arada: bazı kayıtlarda unvan `fullname` alanının içinde,
 * bazılarında ayrı `title` alanında. Arama sonuçları ikisini koşulsuz
 * birleştiriyordu. Yerel veritabanında ölçüldü — on dört doktorun DOKUZUNDA
 * `fullname` zaten unvanla başlıyor, yani bu istisna değil kuraldı:
 *
 *     "Doç. Dr. Doç. Dr. Nazlı Çetin"
 *     "Dt. Dt. Mert Doğan"
 *     "Fzt. Fzt. Burak Şahin"
 *
 * Bir de örtüşen durum: unvan "Doç. Dr.", ad "Dr. Selin Arslan" →
 * "Doç. Dr. Dr. Selin Arslan".
 *
 * `title` her zaman akademik unvan DEĞİL; bazı kayıtlarda uzmanlık yazıyor.
 * Bu yüzden addaki hitap yalnızca unvan AYNI hitapla bitiyorsa düşürülüyor —
 * "Kardiyoloji Uzmanı" + "Dr. Alt Yazı" olduğu gibi kalmalı, çünkü doğrusu o.
 */

test('ad zaten unvanla başlıyorsa unvan eklenmiyor', () => {
  assert.equal(doktorAdi('Doç. Dr.', 'Doç. Dr. Nazlı Çetin'), 'Doç. Dr. Nazlı Çetin');
  assert.equal(doktorAdi('Dt.', 'Dt. Mert Doğan'), 'Dt. Mert Doğan');
  assert.equal(doktorAdi('Fzt.', 'Fzt. Burak Şahin'), 'Fzt. Burak Şahin');
});

test('unvanın son hitabı adın başında tekrar ediyorsa düşüyor', () => {
  assert.equal(doktorAdi('Doç. Dr.', 'Dr. Selin Arslan'), 'Doç. Dr. Selin Arslan');
  assert.equal(doktorAdi('Prof. Dr.', 'Dr. Ayşe Kaya'), 'Prof. Dr. Ayşe Kaya');
});

test('uzmanlık yazan unvan addaki hitabı silmiyor', () => {
  // Buradaki "Dr." kalmalı: unvan bir hitap değil, uzmanlık.
  assert.equal(doktorAdi('Kardiyoloji Uzmanı', 'Dr. Alt Yazı'), 'Kardiyoloji Uzmanı Dr. Alt Yazı');
  assert.equal(doktorAdi('Dahiliye Uzmanı', 'Dr. Demo Hekim'), 'Dahiliye Uzmanı Dr. Demo Hekim');
});

test('eksik veriyle çökmüyor', () => {
  assert.equal(doktorAdi(null, 'Dr. Baska Doktor'), 'Dr. Baska Doktor');
  assert.equal(doktorAdi('Dr.', ''), 'Dr.');
  assert.equal(doktorAdi('', ''), '');
  assert.equal(doktorAdi(undefined, undefined), '');
});

test('büyük/küçük harf ve fazla boşluk karşılaştırmayı bozmuyor', () => {
  // Türkçe'de i/İ katlaması özel; `toLocaleLowerCase('tr')` bunun için.
  //
  // Eşleşme büyük/küçük harfe bakmıyor ama SONUÇ adın kendi yazımını koruyor:
  // kayıttaki unvan alanı özensiz yazılmış olabilir, ekrandaki ad ondan
  // etkilenmemeli.
  assert.equal(doktorAdi('dr.', 'Dr. Mehmet Yıldız'), 'Dr. Mehmet Yıldız');
  assert.equal(doktorAdi('Doç.  Dr.', 'Doç. Dr.  Nazlı Çetin'), 'Doç. Dr. Nazlı Çetin');
});

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

/** Yorumsuz kaynak — açıklama yorumu eski birleştirmeyi METİN olarak taşıyor. */
function yorumsuz(yol) {
  return readFileSync(path.join(uygulamaKok, yol), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .join('\n');
}

test('ekranlar unvanı elle birleştirmiyor', () => {
  for (const dosya of ['src/screens/SearchResults.jsx', 'src/screens/SavedClinics.jsx']) {
    const kaynak = yorumsuz(dosya);

    assert.match(kaynak, /doktorAdi\(/, `${dosya}: ortak yardımcı kullanılmıyor`);
    assert.doesNotMatch(
      kaynak,
      /\$\{\w*\.?title\}\s*\$\{/,
      `${dosya}: unvan ve ad yeniden koşulsuz birleştiriliyor`,
    );
  }
});

test('kart başlıkları sayfa başlığından sonra bir basamak iniyor', () => {
  // h1 → h3 atlaması ekran okuyucuda başlıklar arasında gezinirken boşluk
  // gibi görünüyordu. Boyut sınıflardan geldiği için etiket değişimi ekranı
  // etkilemiyor.
  for (const dosya of ['src/screens/BrowseClinics.jsx', 'src/screens/BrowseTreatments.jsx']) {
    const kaynak = yorumsuz(dosya);

    assert.match(kaynak, /<h2 className="text-sm font-bold text-gray-900 line-clamp-1">/, `${dosya}: kart başlığı h2 değil`);
  }

  const arama = yorumsuz('src/screens/SearchResults.jsx');
  assert.doesNotMatch(arama, /<h3[^>]*>\s*\n?\s*<SlidersHorizontal/, 'süzgeç başlığı hâlâ h3');
});
