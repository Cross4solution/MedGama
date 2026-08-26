import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Seçili para birimi, listede OLMAYAN bir değerde kalmamalı.
 *
 * Gelir ekranı mevcut para birimlerini sunucudan alıp açılır kutuya
 * dolduruyordu, ama seçimi güncellemiyordu: `useState('EUR')` olduğu yerde
 * kalıyordu.
 *
 * Yalnız TL ile fatura kesen bir klinikte sonuç şuydu — canlı yığında
 * ölçüldü:
 *
 *   açılır kutu  → "TRY (₺)"        (tarayıcı, eşleşmeyen değer için
 *                                    listenin ilkini gösteriyor)
 *   API isteği   → currency=EUR     (React hâlâ EUR sanıyor)
 *   ekran        → "€0 Toplam Gelir"
 *
 * Klinik 1500 TL kazanmışken ekran sıfır diyordu ve seçicide TL yazıyordu.
 * Hiçbir hata görünmüyordu: iki taraf da kendi içinde tutarlıydı, yalnız
 * birbirinden habersizdi.
 *
 * Ölçüt kaynağa bakıyor: liste doldurulurken seçimin de doğrulanması şart.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

/** Yorumsuz kaynak — bu açıklama hatayı metin olarak taşıyor. */
const oku = (p) => readFileSync(path.join(kok, p), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((satir) => !satir.trim().startsWith('//'))
  .join('\n');

test('gelir ekranı gösterdiği para birimini sunucunun kullandığına eşitliyor', () => {
  const kaynak = oku('src/screens/crm/CRMRevenue.jsx');

  assert.match(
    kaynak,
    /setCurrencies\(/,
    'para birimi listesi artık doldurulmuyor — bu ölçüt güncellenmeli',
  );

  assert.match(
    kaynak,
    /sd\.currency[\s\S]{0,400}setCurrency\(/,
    'gösterilen para birimi sunucunun kullandığına bağlanmıyor: açılır kutu bir '
    + 'şey gösterirken veri başka bir para biriminden gelir',
  );
});

test('ilk yükleme sunucunun seçmediği bir para birimini dayatmıyor', () => {
  /*
   * Ekran 'EUR' ile başlıyordu. Yalnız TL kesen bir klinikte ilk tur EUR için
   * atılıyor, yanıt "TRY" deyince seçim değişiyor ve AYNI dört uç bir daha
   * çağrılıyordu — sayfa başına dört gereksiz istek ve dört gereksiz
   * veritabanı turu (ölçüldü: 16 istekten 4'ü).
   *
   * Doğrusu: kullanıcı seçmediyse parametre hiç gönderilmiyor. Sunucu
   * kliniğin ilk mevcut para birimini kullanıyor ve hangisini seçtiğini
   * yanıtta söylüyor, yani doğru veri ilk turda geliyor.
   */
  const kaynak = oku('src/screens/crm/CRMRevenue.jsx');

  assert.match(
    kaynak,
    /useState\(null\)/,
    'kullanıcının seçimi boş başlamıyor — ilk tur uydurma bir para birimiyle atılır',
  );

  assert.doesNotMatch(
    kaynak,
    /billingAPI\.stats\(\{\s*currency\s*\}/,
    'ilk istek gösterim durumunu gönderiyor; o durum sunucudan gelmeden önce '
    + 'yalnızca bir varsayılan, ve yanlış olduğunda ikinci bir tur doğuruyor',
  );

  assert.match(
    kaynak,
    /\}, \[secilenParaBirimi,/,
    'veri çekme kullanıcının seçimine değil gösterim durumuna bağlı — gösterim '
    + 'sunucu yanıtıyla değişince ikinci bir tur doğar',
  );
});

test('seçicinin değeri durumdan geliyor', () => {
  // `value={currency}` olmadan açılır kutu tümüyle tarayıcıya kalır ve
  // durumla arasındaki fark hiç fark edilmez.
  assert.match(
    oku('src/screens/crm/CRMRevenue.jsx'),
    /<select\s+value=\{currency\}/,
    'para birimi seçicisi kontrollü değil',
  );
});
