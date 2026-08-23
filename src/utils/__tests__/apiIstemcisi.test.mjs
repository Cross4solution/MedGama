import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * API istemcisinin ara katmanları — her isteğin geçtiği yer.
 *
 * Burada iki şey sınanıyor ve ikisinin de bozulması SESSİZDİR:
 *
 *  1. Jeton okuma. Jeton üç ayrı anahtarda tutulabiliyor (sessionStorage,
 *     localStorage/access_token, auth_state.token). Öncelik bozulursa
 *     kullanıcı giriş yapmış görünür ama istekler jetonsuz gider.
 *
 *  2. 401'de otomatik çıkış. Kural: YALNIZCA istek jeton taşıyorsa. Misafir
 *     bir ziyaretçi isteğe bağlı kimlikli bir uca (herkese açık klinik
 *     sekmesi gibi) dokunduğunda 401 beklenen yanıttır; bunda çıkış
 *     tetiklenirse ziyaretçi durup dururken giriş ekranına atılır. Bu daha
 *     önce yaşandı.
 *
 * Depo taklitleri düz nesne — jsdom gerekmiyor, paket bağımlılıksız kalıyor.
 */

// ── Tarayıcı yüzeyini taklit et (api.js içe aktarılmadan ÖNCE) ──

function depoYap(baslangic = {}) {
  const veri = { ...baslangic };
  return {
    getItem: (k) => (k in veri ? veri[k] : null),
    setItem: (k, v) => { veri[k] = String(v); },
    removeItem: (k) => { delete veri[k]; },
    _veri: veri,
  };
}

const olaylar = [];

globalThis.localStorage = depoYap();
globalThis.sessionStorage = depoYap();
globalThis.window = {
  location: { hostname: 'localhost' },
  dispatchEvent: (e) => olaylar.push(e.type),
};
globalThis.CustomEvent = class { constructor(tur) { this.type = tur; } };

const { default: api, getStoredToken, ERROR_MESSAGES } = await import('../../lib/api.js');

const istekAra = api.interceptors.request.handlers[0].fulfilled;
const hataAra = api.interceptors.response.handlers[0].rejected;

function temizle() {
  for (const d of [localStorage, sessionStorage]) {
    for (const k of Object.keys(d._veri)) d.removeItem(k);
  }
  olaylar.length = 0;
}

/** Ara katmanı hata ile çalıştırır; o reddedilmiş sözü yakalar. */
async function hatayiGecir(hata) {
  try {
    await hataAra(hata);
    assert.fail('hata ara katmanı reddetmedi');
  } catch (e) {
    return e;
  }
}

// ── Jeton okuma ──

test('sessionStorage jetonu localStorage jetonunu geçiyor', () => {
  temizle();
  localStorage.setItem('access_token', 'kalici');
  sessionStorage.setItem('access_token', 'oturumluk');

  // "Beni hatırlama" seçen kullanıcının oturumluk jetonu, eski bir kalıcı
  // jetonun altında kalırsa yanlış hesapla istek atılır.
  assert.equal(getStoredToken(), 'oturumluk');
});

test('auth_state içindeki jeton da okunuyor', () => {
  temizle();
  localStorage.setItem('auth_state', JSON.stringify({ token: 'durumdaki', user: { id: 1 } }));

  assert.equal(getStoredToken(), 'durumdaki');
});

test('bozuk auth_state çökmüyor', () => {
  // Yarım yazılmış JSON okunamaz; istemcinin komple çökmesi tüm uygulamayı
  // düşürür, jetonsuz devam etmesi yalnız giriş ister.
  temizle();
  localStorage.setItem('auth_state', '{bozuk');

  assert.equal(getStoredToken(), null);
});

test('jeton yoksa null dönüyor', () => {
  temizle();
  assert.equal(getStoredToken(), null);
});

// ── İstek ara katmanı ──

test('jeton varken Authorization başlığı ekleniyor', () => {
  temizle();
  localStorage.setItem('access_token', 'abc123');

  const c = istekAra({ headers: {} });

  assert.equal(c.headers.Authorization, 'Bearer abc123');
});

test('jeton yokken Authorization başlığı eklenmiyor', () => {
  // Boş bir "Bearer " başlığı arka uçta geçersiz jeton sayılır ve isteğe
  // bağlı kimlikli uçları 401'e düşürür.
  temizle();

  const c = istekAra({ headers: {} });

  assert.equal(c.headers.Authorization, undefined);
});

test('Accept-Language kullanıcının dilini taşıyor', () => {
  temizle();
  localStorage.setItem('preferred_language', 'de');

  assert.equal(istekAra({ headers: {} }).headers['Accept-Language'], 'de');
});

test('dil seçilmemişse Accept-Language en oluyor', () => {
  temizle();
  assert.equal(istekAra({ headers: {} }).headers['Accept-Language'], 'en');
});

// ── 401 davranışı ──

test('jetonlu 401 oturumu düşürüyor', async () => {
  temizle();
  localStorage.setItem('access_token', 'suresi_dolmus');
  localStorage.setItem('auth_state', JSON.stringify({ token: 'suresi_dolmus' }));
  sessionStorage.setItem('access_token', 'suresi_dolmus');

  await hatayiGecir({
    response: { status: 401, data: {} },
    config: { url: '/appointments', headers: { Authorization: 'Bearer suresi_dolmus' } },
  });

  assert.deepEqual(olaylar, ['auth:logout'], 'çıkış olayı yayınlanmadı');
  // İKİ depo da temizlenmeli: biri kalırsa kullanıcı sonsuz 401 döngüsüne
  // girer — giriş ekranına atılır, eski jeton geri okunur, yine atılır.
  assert.equal(getStoredToken(), null, 'ölü jeton bir depoda hayatta kaldı');
  assert.equal(localStorage.getItem('auth_state'), null);
  assert.equal(sessionStorage.getItem('access_token'), null);
});

test('jetonsuz 401 oturumu düşürmüyor', async () => {
  // ASIL KORUMA. Misafir ziyaretçi herkese açık bir sekmede 401 alabilir;
  // bunda çıkış tetiklenirse durup dururken giriş ekranına atılır.
  temizle();

  await hatayiGecir({
    response: { status: 401, data: {} },
    config: { url: '/clinics/abc/reviews', headers: {} },
  });

  assert.deepEqual(olaylar, [], 'misafir ziyaretçi için çıkış tetiklendi');
});

test('başarısız giriş denemesi mevcut oturumu silmiyor', async () => {
  // Giriş ekranında yanlış parola 401 döner. Bu, o an açık olan başka bir
  // oturumu düşürmemeli.
  temizle();
  localStorage.setItem('access_token', 'gecerli');

  await hatayiGecir({
    response: { status: 401, data: { message: 'Hatalı parola' } },
    config: { url: '/auth/login', headers: { Authorization: 'Bearer gecerli' } },
  });

  assert.deepEqual(olaylar, [], 'giriş denemesi çıkış tetikledi');
  assert.equal(getStoredToken(), 'gecerli', 'giriş denemesi mevcut jetonu sildi');
});

// ── Hata mesajları ──

test('ağ hatası ile zaman aşımı ayrılıyor', async () => {
  temizle();

  const zamanAsimi = await hatayiGecir({ code: 'ECONNABORTED' });
  const ag = await hatayiGecir({ code: 'ERR_NETWORK' });

  assert.equal(zamanAsimi.message, ERROR_MESSAGES.timeout);
  assert.equal(ag.message, ERROR_MESSAGES.network);
});

test('403 yetki mesajı veriyor', async () => {
  temizle();

  const e = await hatayiGecir({ response: { status: 403, data: {} }, config: { url: '/x', headers: {} } });

  assert.equal(e.message, ERROR_MESSAGES.forbidden);
});

test('422 ilk alan hatasını yüzeye çıkarıyor', async () => {
  // Doğrulama hataları alan bazlı gelir; genel bir mesaj gösterilirse
  // kullanıcı hangi alanı düzelteceğini bilemez.
  temizle();

  const e = await hatayiGecir({
    response: { status: 422, data: { errors: { email: ['Bu e-posta zaten kayıtlı.'] } } },
    config: { url: '/auth/register', headers: {} },
  });

  assert.match(e.message, /zaten kayıtlı/);
});
