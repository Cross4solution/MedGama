import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Kâğıda basılan sayfada arayüz olmamalı.
 *
 * Reçete, fatura ve muayene raporu yazdırılıyor — kimi zaman hasta kendi
 * faturasını Ctrl+P ile basıyor. Menü, kenar çubuğu ve çerez bandı kâğıda
 * geldiğinde iki şey oluyor: sayfa yer kaybediyor ve çıktı resmî bir belge
 * gibi durmuyor.
 *
 * Yazdırma stili bunları gizliyor ama listesi eksikti. Ölçüldü:
 *
 *   • `.crm-sidebar` yalnız CRM kenar çubuğunu kapsıyordu. Hasta ve yönetim
 *     panelindeki kenar çubukları `<aside>` ve listede yoktu — hasta kendi
 *     faturasını bastığında menü de kâğıda geliyordu.
 *   • Bu oturumda eklenen "İçeriğe geç" bağlantısı `position: fixed` ve Chrome
 *     sabit ögeleri kâğıdın ilk sayfasına basabiliyor. Reçetenin tepesinde
 *     "İçeriğe geç" satırı istenmez.
 *
 * Sessiz bozulma: kimse çıktıya bakmadan fark etmiyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const kaynakKok = path.resolve(path.dirname(buDosya), '../..');
const uygulamaKok = path.resolve(kaynakKok, '..');

const css = readFileSync(path.join(kaynakKok, 'assets/index.css'), 'utf8');
const kabuk = readFileSync(path.join(uygulamaKok, 'app/SiteChrome.jsx'), 'utf8');

/** `@media print` bloğunun gövdesi. */
function yazdirmaBlogu() {
  // Dosyada `@media print` metni bir YORUM içinde de geçiyor (bölüm başlığı).
  // İlk eşleşmeyi almak yorumu kesip getiriyordu ve testler boşuna kırmızıydı;
  // aranan şey açılış süslüsü olan gerçek kural.
  const kural = /@media print\s*\{/.exec(css);
  assert.ok(kural, 'yazdırma stili tümüyle kaldırılmış');

  // Süslüleri sayarak bloğun sonunu bul: içinde `@page` gibi iç bloklar var.
  let derinlik = 0;
  let i = kural.index + kural[0].length - 1;

  for (; i < css.length; i++) {
    if (css[i] === '{') derinlik++;
    else if (css[i] === '}') {
      derinlik--;
      if (derinlik === 0) break;
    }
  }

  return css.slice(kural.index, i + 1);
}

test('arayüz kabuğunun tamamı yazdırmada gizli', () => {
  const blok = yazdirmaBlogu();

  // `aside` üçünü birden kapsıyor: hasta, CRM ve yönetim kenar çubuğu.
  for (const secici of ['nav', 'header', 'footer', 'aside', '.cookie-banner', '.no-print']) {
    assert.ok(
      new RegExp(`(^|[\\s,])${secici.replace('.', '\\.')}\\s*[,{]`, 'm').test(blok),
      `yazdırmada gizlenmiyor: ${secici}`,
    );
  }
});

test('atlama bağlantısı kâğıda basılmıyor', () => {
  // `position: fixed` olduğu için gizlenmezse ilk sayfanın tepesine düşebilir.
  assert.match(
    kabuk,
    /className="no-print fixed/,
    '"İçeriğe geç" bağlantısı yazdırmada gizlenmiyor',
  );
});

test('kâğıt A4 ve kenar boşlukları tanımlı', () => {
  const blok = yazdirmaBlogu();

  assert.match(blok, /@page\s*\{[^}]*size:\s*A4/, 'kâğıt boyutu tanımlı değil');
  assert.match(blok, /@page\s*\{[^}]*margin:/, 'kenar boşluğu tanımlı değil');
});

test('renkler kâğıda olduğu gibi geçiyor', () => {
  // Tarayıcı varsayılanı arka plan renklerini basmıyor; rapor başlıkları ve
  // durum rozetleri renksiz kalıyordu.
  const blok = yazdirmaBlogu();

  // Hem öneksiz hem `-webkit-` biçimi aranıyor: yalnız birini aramak, ötekini
  // silen bir düzenlemeyi kaçırıyordu — mutasyonla görüldü.
  assert.match(blok, /(?<!-)\bprint-color-adjust:\s*exact/, 'öneksiz `print-color-adjust` yok');
  assert.match(blok, /-webkit-print-color-adjust:\s*exact/, '`-webkit-` biçimi yok (Safari)');
});
