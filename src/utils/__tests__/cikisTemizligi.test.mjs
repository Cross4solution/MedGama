import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Çıkış, oturumdan geriye bir şey bırakmamalı.
 *
 * `lib/echo.js` içindeki `disconnectEcho` tam bunun için yazılmış — kendi notu
 * "call on logout" diyor — ama uygulamada HİÇBİR YERDEN çağrılmıyordu; tek
 * geçtiği yer kendi testiydi. Sonuç: çıkıştan sonra WebSocket bağlantısı önceki
 * oturumun kimliğiyle açık kalıyordu. Paylaşılan bir cihazda sayfa yenilenmeden
 * ikinci kişi giriş yaptığında o bağlantı devralınıyordu.
 *
 * İçe aktarımın DİNAMİK olması ayrıca önemli: `lib/echo` laravel-echo ve
 * pusher-js çekiyor (20 KB gzip) ve `AuthContext` ortak kabukta. Düz bir
 * `import` yazmak, daha önce ölçülüp kaldırılan yükü geri getirirdi — hiç giriş
 * yapmayacak bir ziyaretçinin ana sayfasına. `soketAgirligi` ölçütü o tarafı
 * koruyor; buradaki ölçüt aynı hatayı bu dosyada yakalıyor.
 *
 * Jetonların silinmesi zaten yapılıyordu ve burada sabitleniyor: üç ayrı jeton
 * anahtarı, Google oturumu ve `sessionStorage` kopyaları. Biri listeden düşerse
 * paylaşılan cihazda oturum devralınabilir ve bu sessizdir — uygulama çalışmaya
 * devam eder.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklama yorumu `import`ları METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//') && !s.trim().startsWith('*'))
    .join('\n');
}

const baglam = yorumsuz(oku('src/context/AuthContext.jsx'));

/** `clearLocalAuth` gövdesi. */
function temizlemeGovdesi() {
  const bas = baglam.indexOf('const clearLocalAuth');

  assert.ok(bas > 0, '`clearLocalAuth` bulunamadı — bu ölçüt güncellenmeli');

  return baglam.slice(bas, baglam.indexOf('const performLogout'));
}

test('çıkışta soket bağlantısı kapatılıyor', () => {
  assert.match(
    temizlemeGovdesi(),
    /disconnectEcho\(\)/,
    'Çıkışta `disconnectEcho` çağrılmıyor: WebSocket önceki oturumun kimliğiyle\n'
      + 'açık kalır ve paylaşılan cihazda devralınabilir.',
  );
});

test('soket modülü dinamik içe aktarılıyor', () => {
  // Düz `import` yazmak 20 KB gzip soket yığınını ortak kabuğa geri koyar.
  assert.match(baglam, /import\('\.\.\/lib\/echo'\)/, '`lib/echo` dinamik içe aktarılmıyor');
  assert.doesNotMatch(
    baglam,
    /^import\s[^(]*\bfrom\s+'[^']*lib\/echo/m,
    '`lib/echo` düz `import` ile çekiliyor: pusher-js her sayfaya iner',
  );
});

test('bütün oturum anahtarları siliniyor', () => {
  const govde = temizlemeGovdesi();

  for (const anahtar of ['auth_state', 'access_token', 'google_access_token', 'google_user']) {
    assert.match(
      govde,
      new RegExp(`removeItem\\('${anahtar}'\\)`),
      `çıkışta \`${anahtar}\` silinmiyor: oturum devralınabilir`,
    );
  }

  // `sessionStorage` kopyaları da temizlenmeli.
  assert.match(govde, /sessionStorage\.removeItem\('access_token'\)/, 'sessionStorage jetonu kalıyor');
});

test('çıkış sunucudaki jetonu da iptal ediyor', () => {
  // Yalnız yerelde silmek yetmez: jeton sunucuda geçerli kalırsa kopyalanmış
  // bir jetonla erişim sürer.
  assert.match(baglam, /authAPI\.logout\(\)/, 'çıkışta sunucu tarafı jeton iptali yok');
});

test('kimlik yazan her anahtar çıkışta da siliniyor', () => {
  // Liste ELLE tutulmuyor: yazılanlar ile `clearLocalAuth`ın sildikleri
  // karşılaştırılıyor. Elle tutulan bir liste, tam da yakalaması gereken
  // durumda (yeni anahtar eklenip silme unutulduğunda) güncellenmeyi unutur.
  const silinen = new Set(
    [...temizlemeGovdesi().matchAll(/removeItem\(\s*'([^']+)'/g)].map((m) => m[1]),
  );

  /**
   * Bilerek kalanlar.
   *
   * `auth_logout`: çıkışın KENDİ bıraktığı işaret; silinmesi anlamsız olurdu.
   *
   * `auth_remember`: "beni hatırla" TERCİHİ, oturum durumu değil. Çıkıştan
   * sonra `auth_state` zaten yok, yani hiçbir şeyi açık tutmuyor; bir sonraki
   * girişte de üzerine yazılıyor. Kullanıcının seçimi olduğu için korunuyor.
   */
  const beklenenKalanlar = new Set(['auth_logout', 'auth_remember']);

  const jetonGibi = /token|auth|oturum|session/i;
  const yazilan = new Set();

  const gez = (dizin) => {
    for (const g of readdirSync(dizin, { withFileTypes: true })) {
      if (g.name === '__tests__' || g.name === 'node_modules') continue;

      const tam = path.join(dizin, g.name);
      if (g.isDirectory()) { gez(tam); continue; }
      if (!/\.jsx?$/.test(g.name)) continue;

      for (const m of yorumsuz(readFileSync(tam, 'utf8'))
        .matchAll(/(?:localStorage|sessionStorage)\.setItem\(\s*'([^']+)'/g)) {
        if (jetonGibi.test(m[1])) yazilan.add(m[1]);
      }
    }
  };

  gez(path.join(uygulamaKok, 'src'));

  assert.ok(yazilan.size >= 4, `tarama çalışmıyor: ${yazilan.size} anahtar bulundu`);

  const unutulan = [...yazilan].filter((a) => !silinen.has(a) && !beklenenKalanlar.has(a)).sort();

  assert.deepEqual(
    unutulan,
    [],
    'Bu anahtarlara oturum bilgisi yazılıyor ama çıkışta silinmiyorlar.\n'
      + '`clearLocalAuth` içine ekleyin — ya da gerçekten kalması gerekiyorsa\n'
      + '`beklenenKalanlar` listesine gerekçesiyle yazın.',
  );
});
