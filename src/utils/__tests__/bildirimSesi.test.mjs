import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Bildirim sesi — ne zaman duyulur, ne zaman susar.
 *
 * Kaçırılan bir ses doğrudan kaçırılan bir olay demek: "görüşme başlıyor"
 * bildirimi duyulmazsa hekim muayeneye geç kalır, "randevu iptal edildi"
 * duyulmazsa boşuna beklenir. Ters yönü de gerçek: her mesajda ses çalmak
 * yazışmayı kullanılamaz hâle getiriyor.
 *
 * Kural üç katmanlı ve hepsi sessizce bozulabilir:
 *   • ÖNEMLİ tipler her durumda duyulur (sekme önde olsa bile).
 *   • Mesajlar duyulur, AMA sohbet ekranı açıkken susar.
 *   • Sıradan bildirimler yalnız sekme arka plandayken duyulur.
 */

// ── Tarayıcı yüzeyi taklidi ──

let calinanNotalar = 0;

class SahteOsilator {
  constructor() { this.frequency = { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }; }
  connect() { return this; }
  start() { calinanNotalar++; }
  stop() {}
}

class SahteKazanc {
  constructor() { this.gain = { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }; }
  connect() { return this; }
}

class SahteTampon {
  constructor(uzunluk) { this._veri = new Float32Array(uzunluk); }
  getChannelData() { return this._veri; }
}

class SahteKaynak {
  constructor() { this.buffer = null; }
  connect() { return this; }
  start() { calinanNotalar++; }
  stop() {}
}

class SahteSuzgec {
  constructor() {
    this.type = '';
    this.frequency = { setValueAtTime() {} };
    this.Q = { setValueAtTime() {} };
  }
  connect() { return this; }
}

class SahteAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
  }
  createOscillator() { return new SahteOsilator(); }
  createGain() { return new SahteKazanc(); }
  createBuffer(_k, uzunluk) { return new SahteTampon(uzunluk); }
  createBufferSource() { return new SahteKaynak(); }
  createBiquadFilter() { return new SahteSuzgec(); }
  resume() { return Promise.resolve(); }
}

globalThis.window = { AudioContext: SahteAudioContext, location: { pathname: '/tr' } };
globalThis.document = { visibilityState: 'visible' };
globalThis.localStorage = {
  _v: {},
  getItem(k) { return k in this._v ? this._v[k] : null; },
  setItem(k, v) { this._v[k] = String(v); },
  removeItem(k) { delete this._v[k]; },
};

const { playNotificationSound, playMessageSentSound, setNotificationSoundEnabled, ONEMLI_TIPLER } =
  await import('../notificationSound.js');

/** Sesi çalıp kaç nota üretildiğini döndürür. */
function cal(tip, { gorunur = true, yol = '/tr' } = {}) {
  document.visibilityState = gorunur ? 'visible' : 'hidden';
  window.location.pathname = yol;
  calinanNotalar = 0;
  playNotificationSound(tip);
  return calinanNotalar;
}

test('önemli bildirim sekme öndeyken de duyuluyor', () => {
  // ASIL GÜVENCE. Bunlar kaçırıldığında karşılığı bir muayenenin kaçması.
  setNotificationSoundEnabled(true);

  for (const tip of ONEMLI_TIPLER) {
    assert.ok(cal(tip, { gorunur: true }) > 0, `önemli bildirim sessiz kaldı: ${tip}`);
  }
});

test('sıradan bildirim sekme öndeyken susuyor', () => {
  // Kullanıcı zaten ekrana bakıyor; her beğenide ses çalmak yorucu.
  setNotificationSoundEnabled(true);

  assert.equal(cal('post_liked', { gorunur: true }), 0);
  assert.equal(cal('post_commented', { gorunur: true }), 0);
});

test('sıradan bildirim sekme arka plandayken duyuluyor', () => {
  setNotificationSoundEnabled(true);

  assert.ok(cal('post_liked', { gorunur: false }) > 0, 'arka planda sıradan bildirim de duyulmalı');
});

test('mesaj sohbet ekranı DIŞINDA duyuluyor', () => {
  setNotificationSoundEnabled(true);

  assert.ok(cal('new_chat_message', { gorunur: true, yol: '/tr/dashboard' }) > 0);
});

test('mesaj sohbet ekranı AÇIKKEN susuyor', () => {
  // Mesaj zaten gözünüzün önüne düşüyor; her satırda ses çıkarmak
  // yazışmayı kullanılamaz hâle getirir.
  setNotificationSoundEnabled(true);

  for (const yol of ['/tr/doctor-chat', '/tr/crm/messages', '/en/messages']) {
    assert.equal(cal('new_chat_message', { gorunur: true, yol }), 0, `sohbet ekranında ses çaldı: ${yol}`);
  }
});

test('sohbet ekranı arka plandayken mesaj yine duyuluyor', () => {
  // Sekme arkadaysa kullanıcı mesajı görmüyor demektir.
  setNotificationSoundEnabled(true);

  assert.ok(cal('new_chat_message', { gorunur: false, yol: '/tr/doctor-chat' }) > 0);
});

test('ses kapalıyken hiçbir şey çalmıyor', () => {
  // Klinikte hasta karşısındayken susturulabilmesi gerekiyor.
  setNotificationSoundEnabled(false);

  for (const tip of ['video_call_starting', 'new_chat_message', 'post_liked']) {
    assert.equal(cal(tip, { gorunur: false }), 0, `ses kapalıyken çaldı: ${tip}`);
  }

  setNotificationSoundEnabled(true);
});

test('bilinmeyen tip sıradan sayılıyor', () => {
  // Arka uca yeni bir tip eklendiğinde ses katmanı çökmemeli; sessizce
  // sıradan davranmalı.
  setNotificationSoundEnabled(true);

  assert.equal(cal('bilinmeyen_tip', { gorunur: true }), 0);
  assert.ok(cal('bilinmeyen_tip', { gorunur: false }) > 0);
});

test('tip verilmese de çökmüyor', () => {
  setNotificationSoundEnabled(true);

  assert.doesNotThrow(() => playNotificationSound());
  assert.doesNotThrow(() => playNotificationSound(undefined));
  assert.doesNotThrow(() => playNotificationSound(''));
});

test('ses üretimi başarısız olsa da akış bozulmuyor', () => {
  // Ses hiçbir zaman uygulamayı düşürmemeli.
  setNotificationSoundEnabled(true);
  const eski = window.AudioContext;
  window.AudioContext = function () { throw new Error('ses aygıtı yok'); };

  assert.doesNotThrow(() => playNotificationSound('video_call_starting'));

  window.AudioContext = eski;
});

// ── Gönderme tıkı ──

/** Gönderme sesini çalıp kaç nota üretildiğini döndürür. */
function gonder({ gorunur = true, yol = '/tr/doctor-chat' } = {}) {
  document.visibilityState = gorunur ? 'visible' : 'hidden';
  window.location.pathname = yol;
  calinanNotalar = 0;
  playMessageSentSound();
  return calinanNotalar;
}

test('mesaj gönderilince tık çalıyor', () => {
  setNotificationSoundEnabled(true);

  assert.ok(gonder() > 0, 'gönderme sesi hiç çalmadı');
});

test('gönderme tıkı sohbet ekranında da çalıyor', () => {
  // Gelen mesaj sesinden ayrılan yer burası: gelen mesaj sohbet ekranı
  // açıkken susuyor, çünkü mesaj zaten gözünüzün önüne düşüyor. Gönderme
  // sesi ise KENDİ eyleminizin karşılığı — mesajı gönderdiğiniz yer her
  // zaman sohbet ekranıdır, orada susarsa hiç duyulmaz.
  setNotificationSoundEnabled(true);

  for (const yol of ['/tr/doctor-chat', '/tr/crm/messages']) {
    assert.ok(gonder({ gorunur: true, yol }) > 0, `sohbet ekranında susuyor: ${yol}`);
    assert.equal(cal('new_chat_message', { gorunur: true, yol }), 0,
      `gelen mesaj sohbet ekranında susmalıydı: ${yol}`);
  }
});

test('ses kapalıyken gönderme tıkı da susuyor', () => {
  setNotificationSoundEnabled(false);

  assert.equal(gonder(), 0, 'susturma anahtarı gönderme sesini kapatmıyor');

  setNotificationSoundEnabled(true);
});

test('gönderme tıkı gelen mesaj sesinden kısa', () => {
  // Tasarım kuralı: gönderdiğinizi zaten biliyorsunuz, ses yalnızca "gitti"
  // diyor. Gelen mesaj dikkat istiyor. İkisi eşit olsaydı yoğun bir sohbette
  // hangisinin ne olduğu ayırt edilemezdi.
  setNotificationSoundEnabled(true);

  // Sayaç ses KAYNAĞI sayıyor. Gelen mesaj sesi saf sinüs notalarından
  // kurulu (her nota = temel + harmonik, 2 osilatör). Gönderme sesi ise
  // vurmalı: bir düşen sinüs gövdesi + bir gürültü atağı = 2 kaynak.
  const gondermeKaynak = gonder();
  const gelenKaynak = cal('new_chat_message', { gorunur: true, yol: '/tr/dashboard' });

  assert.equal(gondermeKaynak, 2, 'gönderme sesi: gövde + atak');
  assert.equal(gelenKaynak, 4, 'gelen mesaj: iki nota (4 osilatör)');
  assert.ok(gelenKaynak > gondermeKaynak, 'gelen mesaj sesi daha zengin olmalı');
});

test('ses aygıtı yokken mesaj göndermek bozulmuyor', () => {
  setNotificationSoundEnabled(true);
  const eski = window.AudioContext;
  window.AudioContext = function () { throw new Error('ses aygıtı yok'); };

  assert.doesNotThrow(() => playMessageSentSound());

  window.AudioContext = eski;
});
