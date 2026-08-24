import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Bildirim balonları — duyulabilir ve ulaşılabilir olmaları.
 *
 * Balonlar uygulamanın tek geri bildirim kanalı: "randevu iptal edildi",
 * "kaydedilemedi", "mesaj gönderildi". Ekrana bakmayan biri için bunları
 * kaçırmak, olayı kaçırmak demek.
 *
 * Ölçüldü, üç kusur:
 *
 *   • "Click to view" sabit İngilizceydi. Dokuz dilin dokuzunda da öyle
 *     görünüyordu.
 *   • Kapatma düğmesi yalnız bir ikon taşıyordu, adı yoktu: ekran okuyucu
 *     "düğme" deyip geçiyordu.
 *   • Balona tıklayıp gitme eylemi balonun KÖKÜNDEYDİ ve kök bir `div`di —
 *     fareyle çalışıyor, klavyeye hiç görünmüyordu.
 *
 * Dördüncüsü tür ayrımı: her balon `role="alert"` taşıyordu. `alert` araya
 * girer; başarı bildirimi için bu, kullanıcının o an okuduğu cümleyi kesmek
 * demek.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../..');

const kaynak = readFileSync(path.join(kok, 'context/ToastContext.jsx'), 'utf8');

test('düğmeye basmak eylemi iki kez çalıştırmıyor', () => {
  // Kökte de aynı eylem duruyor. Düğme yayılımı durdurmazsa tek tıklama iki
  // gezinme tetikliyor.
  assert.match(
    kaynak,
    /onClick=\{\(e\) => \{\s*\/\/[\s\S]{0,200}?e\.stopPropagation\(\);[\s\S]{0,200}?__TOAST_NAVIGATE/,
    'eylem düğmesi yayılımı durdurmuyor: tek tıklama iki kez çalışır',
  );
});

test('gitme eylemi gerçek bir düğmede', () => {
  // Kökteki tıklama fare kolaylığı olarak duruyor; aranan şey, eylemin AYRICA
  // odaklanabilir bir denetime bağlı olması.
  const dugmeler = [...kaynak.matchAll(/<button[\s\S]{0,900}?<\/button>/g)].map((m) => m[0]);

  assert.ok(
    dugmeler.some((d) => d.includes('__TOAST_NAVIGATE') || d.includes('t.onClick')),
    'Balonun eylemi hiçbir düğmede değil: yalnız fareyle tetiklenebilir.',
  );
});

test('kapatma düğmesinin okunabilir bir adı var', () => {
  assert.match(
    kaynak,
    /remove\(t\.id\)[\s\S]{0,200}aria-label=/,
    'kapatma düğmesinin adı yok: ekran okuyucu yalnız "düğme" der',
  );
});

test('balon metinleri çeviriden geliyor', () => {
  assert.match(kaynak, /ceviri\('toast\.clickToView'/, '"Click to view" yeniden sabitlenmiş');
  assert.match(kaynak, /ceviri\('toast\.dismiss'/, 'kapatma adı sabitlenmiş');

  // Sabit İngilizce metin kalmadığının kontrolü: JSX içinde düz "Click to view".
  assert.doesNotMatch(kaynak, />\s*Click to view\s*</, 'sabit İngilizce metin geri gelmiş');
});

test('yalnız hata ve uyarı araya giriyor', () => {
  // `alert` kullanıcının cümlesini keser, `status` sırasını bekler. Başarı ve
  // bilgi için kesmek gereksiz ve rahatsız edici.
  assert.match(
    kaynak,
    /role=\{t\.type === 'error' \|\| t\.type === 'warning' \? 'alert' : 'status'\}/,
    'balon türleri yeniden tek role düşürülmüş: her bildirim araya girer',
  );
});

test('balon metinleri dokuz dilde de var', () => {
  for (const dil of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'it', 'az']) {
    const sozluk = JSON.parse(readFileSync(path.join(kok, `i18n/locales/${dil}.json`), 'utf8'));

    assert.ok(sozluk.toast?.clickToView, `${dil}.json içinde toast.clickToView yok`);
    assert.ok(sozluk.toast?.dismiss, `${dil}.json içinde toast.dismiss yok`);
  }
});
