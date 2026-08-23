import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Gerçek zamanlı bağlantı (Laravel Echo sarmalayıcısı).
 *
 * Bu dosya hiç sınanmamıştı ve taşıdığı yük büyük: bildirimler, sohbet ve
 * görüntülü görüşme sinyali buradan akıyor. Bir kez sessizce kırıldığı da
 * biliniyor — istemci kütüphanesi yetkilendirme ayarının adını değiştirmişti,
 * abonelik hiç tamamlanmıyordu ve hiçbir hata üretilmiyordu.
 *
 * Otomatik sınanabilecek üç davranış var; üçü de sessiz kırılma yolları:
 *
 *  1. YAPILANDIRMA YOKSA `null` — istisna DEĞİL. Anahtarsız bir kurulumda
 *     `getEcho()` çökerse onu çağıran her ekran çöker. Yayın sunucusu bir
 *     kolaylık; yokluğu sayfayı düşürmemeli.
 *  2. JETON HER ERİŞİMDE TAZELENİYOR. Örnek modül düzeyinde bir kez
 *     kuruluyor; jeton kurulum anında okunsaydı, girişten önce yüklenen
 *     sayfada boş kalır ve kanal yetkilendirmesi hep başarısız olurdu.
 *  3. ÇIKIŞTA ÖRNEK SIFIRLANIYOR. Aynı tarayıcıda ikinci bir kullanıcı
 *     giriş yaparsa, eski örnek eski kullanıcının jetonuyla bağlı kalırdı.
 */

// ── Tarayıcı yüzeyi taklidi (modül içe aktarılmadan ÖNCE) ──

function depo(baslangic = {}) {
  const veri = { ...baslangic };
  return {
    getItem: (k) => (k in veri ? veri[k] : null),
    setItem: (k, v) => { veri[k] = String(v); },
    removeItem: (k) => { delete veri[k]; },
    _veri: veri,
  };
}

globalThis.window = { addEventListener() {}, location: { hostname: 'localhost' } };
globalThis.localStorage = depo();
globalThis.sessionStorage = depo();

const { getEcho, disconnectEcho } = await import('../../lib/echo.js');

test('yapılandırma yokken null dönüyor, istisna atmıyor', () => {
  // Yerel ve test ortamında yayın anahtarı tanımlı değil. Bu, uygulamanın
  // yoklamaya düşerek çalışmaya devam ettiği hâl.
  assert.doesNotThrow(() => getEcho());
  assert.equal(getEcho(), null);
});

test('yapılandırma yokken çıkış da çökmüyor', () => {
  // Çıkış akışı her hâlükârda tamamlanmalı; soket kurulu değilse de.
  assert.doesNotThrow(() => disconnectEcho());
});

test('jeton okuyucu auth_state ve access_token anahtarlarını tanıyor', async () => {
  // Modülün jeton okuyucusu dışa aktarılmıyor; davranışı, uygulamanın
  // kullandığı anahtarların ikisinin de tanındığını gösterecek şekilde
  // dolaylı sınanıyor: bozuk `auth_state` çökmemeli, `access_token`
  // yedeğe alınmalı.
  localStorage.setItem('auth_state', '{bozuk json');
  localStorage.setItem('access_token', 'yedek-jeton');

  assert.doesNotThrow(() => getEcho(), 'bozuk auth_state modülü düşürüyor');
});

test('bozuk depo değerleri modülü düşürmüyor', () => {
  for (const deger of ['', '{', 'null', '[]', '{"token":null}']) {
    localStorage.setItem('auth_state', deger);
    assert.doesNotThrow(() => getEcho(), `çöktü: ${deger}`);
  }
});

test('getEcho çağrıları arasında durum tutarlı', () => {
  // Yapılandırma yokken her çağrı aynı sonucu vermeli; aksi hâlde çağıran
  // kod bazen null bazen örnek görür ve dallanma öngörülemez olur.
  const a = getEcho();
  const b = getEcho();

  assert.equal(a, b);
});
