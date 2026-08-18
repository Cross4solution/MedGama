/**
 * Genel kurulum: her rol için bir kez giriş yapıp oturumu diske yazar.
 *
 * Testlerin her biri ayrı ayrı giriş yapınca giriş ucunun hız sınırına
 * takılıyor ve testler zaman aşımına düşüyordu. Oturum bir kez alınıp
 * paylaşıldığında hem sorun bitiyor hem testler hızlanıyor.
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const HESAPLAR = {
  hasta:  { email: 'patient@demo.com', sifre: 'patient123' },
  doktor: { email: 'doctor@demo.com',  sifre: 'doctor123' },
};

const KLASOR = path.join(__dirname, '.oturum');

function oturumDosyasi(rol) {
  return path.join(KLASOR, `${rol}.json`);
}

module.exports = async function kurulum(config) {
  const baseURL = config.projects[0].use.baseURL;
  fs.mkdirSync(KLASOR, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const [rol, { email, sifre }] of Object.entries(HESAPLAR)) {
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();
      await page.goto('/tr');

      const sonuc = await page.evaluate(async ({ email, sifre }) => {
        const r = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email, password: sifre }),
        });
        if (!r.ok) return { ok: false, status: r.status };
        const j = await r.json();
        const token = j?.token || j?.data?.token;
        const user = j?.data || j?.user;
        if (!token) return { ok: false, status: 'token yok' };
        localStorage.setItem('auth_state', JSON.stringify({ user, token, country: 'TR' }));
        localStorage.setItem('auth_remember', '1');
        localStorage.removeItem('auth_logout');
        // Çerez bandı testlerin önünü kapatmasın
        localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary: true, analytics: false, personalization: false }));
        return { ok: true };
      }, { email, sifre });

      if (!sonuc.ok) {
        throw new Error(`Kurulumda giriş başarısız (${rol}): ${sonuc.status}`);
      }

      await context.storageState({ path: oturumDosyasi(rol) });
      await context.close();
    }

    // Şifresiz demo doktoru: kurulumda DOĞRULANMIŞ olarak açılıyor, bu yüzden
    // randevu onaylama gibi doğrulama isteyen işlemler yalnızca onunla
    // sınanabiliyor. Seed'deki doctor@demo.com doğrulanmamış.
    try {
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();
      await page.goto('https://medagama-backend.onrender.com/api/demo-login/doctor', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/med-gama\.vercel\.app|localhost/, { timeout: 60_000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        localStorage.setItem('auth_remember', '1');
        localStorage.removeItem('auth_logout');
        localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary: true, analytics: false, personalization: false }));
      });
      await context.storageState({ path: oturumDosyasi('demoDoktor') });
      await context.close();
    } catch (e) {
      // Demo giriş kapalıysa (teslimde kapatılacak) o testler atlanır.
      console.warn('Demo doktor oturumu alınamadı:', e.message);
    }
  } finally {
    await browser.close();
  }
};

module.exports.oturumDosyasi = oturumDosyasi;
module.exports.HESAPLAR = HESAPLAR;
