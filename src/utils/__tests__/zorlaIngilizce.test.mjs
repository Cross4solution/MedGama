import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Arka ucun yerelleştirdiği metni ön yüzde İngilizceye çevirmek.
 *
 * `src/utils/i18n.js` iki yardımcı taşıyor ve ikisi de İngilizce-tek-dil
 * döneminden kalma: `toEnglishTimestamp` göreli zamanı, `translateSpecialty`
 * uzmanlık adını sabit bir haritayla İngilizceye çeviriyor.
 *
 * İkisi de artık ZARARLI, çünkü arka uç aynı metni zaten kullanıcının
 * dilinde gönderiyor. Ölçüldü:
 *
 *     Accept-Language: tr → "4 gün önce"   / uzmanlık: "Kardiyoloji"
 *     Accept-Language: de → "vor 4 Tagen"
 *     Accept-Language: en → "4 days ago"   / uzmanlık: "Cardiology"
 *
 * Dönüşüm koşulsuz uygulanıyordu. Almanca metni tanımadığı için ona
 * dokunmuyor — ama Türkçeyi tanıyıp çeviriyordu. Sonuç: Türk kullanıcı,
 * arayüzün geri kalanı Türkçeyken akıştaki her kartta "4 days ago" ve
 * "Cardiology" görüyordu. Dört bileşende birden.
 *
 * Hata sessiz: bir şey bozulmuş gibi durmuyor, sadece yanlış dilde.
 */

const buDosya = fileURLToPath(import.meta.url);
const kaynakKok = path.resolve(path.dirname(buDosya), '../..');

const YASAKLI = ['toEnglishTimestamp', 'translateSpecialty'];

function dosyalar(dizin = kaynakKok, toplam = []) {
  for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) {
      if (girdi.name === '__tests__') continue;
      dosyalar(tam, toplam);
    } else if (/\.(js|jsx)$/.test(girdi.name)) {
      toplam.push(tam);
    }
  }
  return toplam;
}

test('yerelleşmiş metin ön yüzde İngilizceye çevrilmiyor', () => {
  const kusurlu = [];
  let tarandi = 0;

  for (const yol of dosyalar()) {
    // Yardımcıların KENDİ tanımlandığı dosya hariç.
    if (yol.endsWith(path.join('utils', 'i18n.js'))) continue;

    tarandi++;
    const metin = readFileSync(yol, 'utf8');

    for (const [i, satir] of metin.split('\n').entries()) {
      const kirpik = satir.trim();
      // Bu kuralı ANLATAN yorumlar da aynı adları içeriyor.
      if (kirpik.startsWith('//') || kirpik.startsWith('*') || kirpik.startsWith('/*')) continue;

      for (const ad of YASAKLI) {
        if (satir.includes(ad)) {
          kusurlu.push(`${path.relative(kaynakKok, yol)}:${i + 1}  (${ad})`);
        }
      }
    }
  }

  assert.ok(tarandi > 100, `tarama çalışmıyor: ${tarandi} dosya`);

  assert.deepEqual(
    kusurlu,
    [],
    'Arka uç bu metinleri zaten kullanıcının dilinde gönderiyor; çevirmek\n'
      + 'Türkçe kullanıcıya İngilizce gösterir:\n  ' + kusurlu.join('\n  '),
  );
});
