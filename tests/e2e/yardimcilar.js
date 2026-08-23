// Testlerin ortak parçaları.
const { oturumDosyasi, HESAPLAR } = require('./kurulum');

/** Çerez bandı ekranı kapatıyorsa en gizlilik korumacı seçenekle kapat. */
async function cerezBandiniKapat(page) {
  const reddet = page.getByRole('button', { name: /Tümünü Reddet|Reject all/i });
  if (await reddet.isVisible().catch(() => false)) {
    await reddet.click();
    await page.waitForTimeout(300);
  }
}

/** Oturum sahibinin API çağrısı yapmasını sağlar (token localStorage'da). */
/**
 * Doğrulama isteği — HANGİ arka uca gittiği önemli.
 *
 * Yol göreliydi (`/api/...`), yani tarayıcı isteği ön yüz kökenine atıyordu.
 * Orada Next'in `rewrites` kuralı var ve hedefi:
 *
 *     const BACKEND = process.env.NEXT_PUBLIC_API_ORIGIN
 *         || 'https://medagama-backend.onrender.com';
 *
 * Yerel koşuda o değişken tanımlı olmadığı için `/api/*` CANLIYA gidiyordu:
 * testler yerel yığını sürüyor ama doğrulamalarını canlıdan okuyordu. Ölçüldü —
 * aynı yerel jetonla doğrudan arka uç `language:"de"`, ön yüz kökeni `"en"`
 * (yani canlının kimliksiz yanıtı) döndü. Sessiz ve yanıltıcı: test kırmızı
 * yanıyor ama gösterdiği hata yerelde yok.
 *
 * Daha kötüsü, durum DEĞİŞTİREN bir yardımcı çağrısı canlıya yazardı.
 *
 * `E2E_API_ORIGIN` verildiyse istek doğrudan o arka uca gider.
 */
/**
 * İsteklerin gideceği arka uç kökü.
 *
 * Göreli `/api` yolu ön yüz kökenine gider; orada Next'in `rewrites` kuralı
 * var ve YEREL koşuda iki ayrı şekilde yanlış sonuç veriyor:
 *
 *  • `NEXT_PUBLIC_API_ORIGIN` tanımlı değilse hedef CANLI arka uç olur —
 *    testler yerel yığını sürüp doğrulamalarını canlıdan okur.
 *  • Tanımlı olsa bile Bearer kimliği geçmez: `sanctum.stateful` listesinde
 *    `localhost:3000` var, yani proxy'lenen istek çerez oturumu sanılıp
 *    jeton yok sayılıyor. Ölçüldü: aynı jeton doğrudan 200, proxy'den 401.
 *
 * Bu yüzden testler arka uca DOĞRUDAN gider.
 */
function apiKok() {
  return (process.env.E2E_API_ORIGIN || '').replace(/\/+$/, '');
}

async function apiIstek(page, yol, ayar = {}) {
  const kok = apiKok();
  const tamYol = kok && yol.startsWith('/api') ? kok + yol : yol;

  return page.evaluate(async ({ yol, ayar }) => {
    // Jeton üç ayrı anahtarda olabiliyor; uygulamanın kendi önceliğiyle aynı.
    const t = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('access_token'))
      || localStorage.getItem('access_token')
      || JSON.parse(localStorage.getItem('auth_state') || '{}').token;
    const r = await fetch(yol, {
      ...ayar,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + t,
        ...(ayar.headers || {}),
      },
    });
    let govde = null;
    try { govde = await r.json(); } catch {}
    return { http: r.status, govde };
  }, { yol: tamYol, ayar });
}

module.exports = { HESAPLAR, oturumDosyasi, cerezBandiniKapat, apiIstek, apiKok };
