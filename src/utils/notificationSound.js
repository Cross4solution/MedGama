/**
 * Bildirim sesi.
 *
 * İki karakter var ve ayrım bilinçli: gün içinde düşen sıradan bildirimler
 * (yorum, beğeni, yeni mesaj) yumuşak çan; kaçırılması sorun yaratan
 * bildirimler (görüşme başlıyor, randevu iptal/saat değişikliği, şifre
 * değiştirildi) yükselen üçlü. Tek ses kullanılırsa ya hepsi yorucu olur ya
 * hiçbiri fark edilmez.
 *
 * Sesler dosya yerine Web Audio ile üretiliyor: indirilecek varlık yok,
 * paket büyümüyor ve ilk bildirimde ağ beklenmiyor.
 */

// Kaçırılamayacak bildirimler. Burada olmayan her tip sıradan sayılır.
const ONEMLI_TIPLER = new Set([
  'video_call_starting',
  'appointment_cancelled',
  'appointment_rescheduled',
  'password_changed',
]);

let audioCtx = null;

function ctxAl() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Tarayıcı, kullanıcı sayfayla etkileşmeden ses çalmayı engelliyor ve
  // bağlamı "suspended" bırakıyor. İlk tıklamadan sonra sürdürülebiliyor.
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

/**
 * Tek nota: sinüs + hafif ikinci harmonik, üstel sönümleme.
 * Sert başlangıç "tık" sesi ürettiği için atak bilerek yumuşak.
 */
function nota(ctx, frekans, baslangic, sure, seviye) {
  const osc = ctx.createOscillator();
  const ust = ctx.createOscillator();
  const kazanc = ctx.createGain();

  osc.type = 'sine';
  ust.type = 'sine';
  osc.frequency.setValueAtTime(frekans, baslangic);
  ust.frequency.setValueAtTime(frekans * 2, baslangic);

  kazanc.gain.setValueAtTime(0.0001, baslangic);
  kazanc.gain.exponentialRampToValueAtTime(seviye, baslangic + 0.012);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, baslangic + sure);

  const ustKazanc = ctx.createGain();
  ustKazanc.gain.setValueAtTime(0.18, baslangic);

  osc.connect(kazanc);
  ust.connect(ustKazanc);
  ustKazanc.connect(kazanc);
  kazanc.connect(ctx.destination);

  osc.start(baslangic);
  ust.start(baslangic);
  osc.stop(baslangic + sure + 0.02);
  ust.stop(baslangic + sure + 0.02);
}

/** Yumuşak çan — iki nota, ikincisi beşli yukarıda. */
function yumusakCan(ctx) {
  const t = ctx.currentTime;
  nota(ctx, 880.0, t, 0.55, 0.10);
  nota(ctx, 1318.5, t + 0.09, 0.50, 0.07);
}

/** Yükselen üçlü — üç artan nota. */
function yukselenUclu(ctx) {
  const t = ctx.currentTime;
  nota(ctx, 659.3, t, 0.30, 0.09);
  nota(ctx, 830.6, t + 0.085, 0.30, 0.09);
  nota(ctx, 987.8, t + 0.17, 0.45, 0.10);
}

// Kullanıcının tercihi. Sunucudan gelene kadar açık kabul edilir; hesabında
// kapalıysa ilk yüklemede kapanır.
let sesAcik = true;

export function setNotificationSoundEnabled(acik) {
  sesAcik = acik !== false;
}

export function isNotificationSoundEnabled() {
  return sesAcik;
}

/**
 * Bildirim sesi çal.
 *
 * @param {string} tip  Bildirim tipi (ör. 'video_call_starting'). Boş
 *                      bırakılırsa sıradan sayılır.
 */
export function playNotificationSound(tip = '') {
  try {
    if (!sesAcik) return;

    const onemli = ONEMLI_TIPLER.has(tip);

    // Önemli bildirim her durumda duyulur.
    //
    // Mesajlar da duyulur — ama sohbet ekranı açıkken değil: orada mesaj
    // zaten gözünüzün önüne düşüyor, her satırda ses çıkarmak yazışmayı
    // yorucu hale getiriyor. Başka bir ekrandayken (panel, randevular,
    // akış) çalar.
    //
    // Geri kalan sıradan bildirimler yalnızca sekme arka plandayken çalar.
    const mesajMi = tip.includes('message') || tip.includes('chat');
    const sohbetteyiz = mesajMi
      && document.visibilityState === 'visible'
      && /\/(doctor-chat|messages|crm\/messages)(\/|$)/.test(window.location.pathname);

    if (sohbetteyiz) return;
    if (!onemli && !mesajMi && document.visibilityState === 'visible') return;

    const ctx = ctxAl();
    if (!ctx) return;

    if (onemli) yukselenUclu(ctx);
    else yumusakCan(ctx);
  } catch {
    // Ses hiçbir zaman akışı bozmamalı.
  }
}

export { ONEMLI_TIPLER };
