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
async function apiIstek(page, yol, ayar = {}) {
  return page.evaluate(async ({ yol, ayar }) => {
    const t = JSON.parse(localStorage.getItem('auth_state') || '{}').token;
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
  }, { yol, ayar });
}

module.exports = { HESAPLAR, oturumDosyasi, cerezBandiniKapat, apiIstek };
