import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Olmayan bir adres gerçekten 404 dönmeli.
 *
 * Ölçüldü: olmayan doktor, klinik, tedavi ve rastgele yollar HTTP **200**
 * dönüyordu. Sayfa boş geliyor, "404 Sayfa Bulunamadı" ancak tarayıcıda
 * JavaScript çalıştıktan sonra beliriyordu.
 *
 * Üç ayrı bedeli var ve üçü de sessiz:
 *   • Arama motoru bu adresleri geçerli sayfa sanıp indeksliyor (yumuşak 404).
 *   • İzleme ve bağlantı denetleyicileri kırık bağlantıyı fark edemiyor.
 *   • JavaScript'i geç yüklenen kullanıcı önce bomboş bir sayfa görüyor.
 *
 * Sebebi `SiteChrome` içinde `{children}` çevresindeki `<Suspense
 * fallback={null}>` sarmalayıcısıydı: `notFound()` sinyali o sınırda yutuluyor,
 * yanıt 200 olarak kapanıyordu. Kaldırıldığında altı yolun altısı da 404 ve tam
 * arayüzle dönüyor — ölçüldü, hem geliştirme hem üretim derlemesinde.
 *
 * Dosyanın kendi yorumu zaten `{children}`in Suspense DIŞINDA olması
 * gerektiğini yazıyordu; kod o niyetten ayrılmıştı.
 *
 * Kabuk parçaları (başlık, kenar çubuğu, alt bilgi, çerez bandı) kendi
 * Suspense sınırlarında kalıyor — onlar `useSearchParams` çağırabildiği için
 * gerekli. Kaldırılan yalnız içeriği saran sınır.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const kabuk = readFileSync(path.join(uygulamaKok, 'app/SiteChrome.jsx'), 'utf8');

test('sayfa içeriği Suspense sınırıyla sarılmıyor', () => {
  // Sarılırsa `notFound()` yutulur ve olmayan her adres 200 döner.
  const sarili = /<Suspense[^>]*>\s*\{children\}\s*<\/Suspense>/.test(kabuk);

  assert.equal(
    sarili,
    false,
    '`{children}` yeniden Suspense içine alınmış: `notFound()` yutulur, olmayan\n'
      + 'adresler 200 döner ve arama motoru onları geçerli sayfa sayar.',
  );
});

test('kabuk parçaları kendi Suspense sınırlarını koruyor', () => {
  // Ters yönde bozulma: hepsini kaldırmak, `useSearchParams` kullanan kabuk
  // parçaları yüzünden sayfaları istemci tarafına düşürür.
  assert.ok(
    (kabuk.match(/<Suspense fallback=\{null\}>/g) || []).length >= 4,
    'kabuk parçalarının Suspense sınırları da kaldırılmış',
  );
});

test('iki not-found sınırı da yerinde', () => {
  // Yalnız iç içe olan yeterli değil: kök sınır olmadan yanıt 200 kalıyor.
  for (const yol of ['app/not-found.jsx', 'app/[locale]/not-found.jsx']) {
    const metin = readFileSync(path.join(uygulamaKok, yol), 'utf8');

    assert.match(metin, /export default function NotFound/, `${yol} bir sınır bileşeni değil`);
  }
});

test('404 sayfası ana sayfaya dönüş yolu veriyor', () => {
  // Kullanıcı çıkmaz sokakta kalmamalı.
  const metin = readFileSync(path.join(uygulamaKok, 'app/[locale]/not-found.jsx'), 'utf8');

  assert.match(metin, /<a\s[^>]*href=/, '404 sayfasında dönüş bağlantısı yok');
});

test('404 sayfası arama motoruna indekslenmemesini söylüyor', () => {
  const kokSinir = readFileSync(path.join(uygulamaKok, 'app/not-found.jsx'), 'utf8');

  assert.match(kokSinir, /robots:\s*\{\s*index:\s*false/, '404 sayfası indekslenmeye açık');
});
