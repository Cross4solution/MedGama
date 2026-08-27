import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Kısmi bir toplam "Toplam" diye sunulamaz.
 *
 * Gelir ekranı "Toplam Gelir — 3.000 ₺" yazıyordu. Hem lira hem euro ile
 * fatura kesen bir klinikte bu rakam toplam DEĞİL: ayrıca euro faturalar var
 * ve bu sayıya dahil değiller. Sistemde şu an tam olarak öyle bir klinik var.
 *
 * Sayfada bir para birimi seçici duruyor, ama onu değiştirince aynı paranın
 * başka birimini değil BAŞKA BİR GELİRİ göreceğini hiçbir şey söylemiyordu.
 * Veri doğruydu, hesap doğruydu; yanıltan kelimeydi.
 *
 * Etiket artık birden çok para birimi varken hangi birimi gösterdiğini
 * söylüyor. Tek para birimi kullanan klinikte hiçbir şey değişmiyor — orada
 * gizlenen bir şey yok ve gereksiz parantez gürültü olurdu.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (goreli) => readFileSync(path.join(kok, goreli), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((s) => !s.trim().startsWith('//') && !s.trim().startsWith('*'))
  .join('\n');

test('etiket yalnız birden çok para birimi varken birimi ekliyor', () => {
  const kaynak = oku('src/screens/crm/CRMRevenue.jsx');

  assert.match(
    kaynak,
    /currencies\.length > 1[\s\S]{0,120}CURRENCY_SYMBOLS\[currency\]/,
    'etiket koşulsuz ya da hiç birim eklemiyor',
  );
});

test('para tutarı taşıyan kartların hepsi bu etiketten geçiyor', () => {
  /*
   * Kartlardan biri atlanırsa o kart "Toplam" demeye devam eder ve kusur
   * kısmen sürer. Dışa aktarılan özet de aynı etiketleri kullanıyor —
   * ekranda düzeltip Excel'de düzeltmemek daha kötü olurdu.
   */
  const kaynak = oku('src/screens/crm/CRMRevenue.jsx');

  for (const anahtar of [
    'crm.revenue.totalRevenue',
    'crm.revenue.monthlyRev',
    'crm.revenue.receivable',
  ]) {
    const desen = new RegExp(`pbEtiketi\\(t\\('${anahtar.replace(/\./g, '\\.')}'`);
    assert.match(kaynak, desen, `${anahtar} etiketi para birimini söylemiyor`);
  }

  // Sekiz kullanım: ekrandaki dört kart + dışa aktarımdaki dört satır.
  const sayi = (kaynak.match(/pbEtiketi\(/g) || []).length;
  assert.ok(sayi >= 8, `beklenenden az kullanım: ${sayi}`);
});
