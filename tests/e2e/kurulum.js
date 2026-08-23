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

// Yönetici oturumu — ORTAM DEĞİŞKENİNDEN, depodan değil.
//
// Yönetim panelinin 13 ekranı test edilemiyordu: şifresiz demo girişi bilerek
// yalnızca hasta/doktor/klinik için açık (süper yöneticiye şifresiz kapı
// açmak canlıda kabul edilemez, bu doğru karar). Yetkili oturumu almanın
// kalıcı kapı açmayan yolu bu:
//
//   E2E_ADMIN_EMAIL=...  E2E_ADMIN_PASSWORD=...  npx playwright test
//
// Değişkenler tanımlı değilse hiçbir şey yapılmaz; yönetim testleri atlanır.
// Şifre depoya yazılmaz, oturum dosyası .oturum/ altında ve .gitignore'da.
const YONETICI = {
  email: process.env.E2E_ADMIN_EMAIL || '',
  sifre: process.env.E2E_ADMIN_PASSWORD || '',
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
    // YEREL KİP: E2E_API_ORIGIN verildiyse oturumların tamamı şifresiz demo
    // girişinden alınıyor ve parola ile giriş hiç denenmiyor.
    //
    // Sebep: yerel tohumda `@demo.com` hesapları YOK (adresler
    // `@medagama.com`), ama demo girişi eksik hesabı kendisi oluşturuyor.
    // Ayrıca yerelde çalışmak, durum değiştiren testlerin canlı veriye
    // dokunmaması demek — bu paketin "iz bırakma" kuralı da o yüzden vardı.
    const yerelKip = Boolean(process.env.E2E_API_ORIGIN);
    const girisYapilacak = yerelKip ? [] : Object.entries(HESAPLAR);
    if (YONETICI.email && YONETICI.sifre) {
      girisYapilacak.push(['yonetici', YONETICI]);
    } else {
      // Sessizce atlamak, testin neden atlandığını gizliyordu.
      console.warn('Yönetici oturumu alınmadı: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD tanımlı değil.');
    }

    for (const [rol, { email, sifre }] of girisYapilacak) {
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
        await context.close();

        // Yönetici hesabı İSTEĞE BAĞLI: yanlış parola ya da kapalı hesap
        // yüzünden bütün paketin durması doğru değil. Oturum dosyası
        // yazılmayınca yönetim testleri zaten kendiliğinden atlanıyor.
        if (rol === 'yonetici') {
          console.warn(
            `\n⚠  Yönetici girişi başarısız (HTTP ${sonuc.status}). Yönetim paneli testleri ATLANACAK.\n` +
            '   422 = e-posta/parola hatalı · 429 = çok fazla deneme, bir dakika bekleyin\n' +
            '   502/503 = arka uç uyanıyor, tekrar deneyin\n',
          );
          continue;
        }

        throw new Error(`Kurulumda giriş başarısız (${rol}): ${sonuc.status}`);
      }

      await context.storageState({ path: oturumDosyasi(rol) });
      await context.close();
    }

    // ── Şifresiz demo oturumları ──
    //
    // Doğrulanmış hekim ve klinik sahibi oturumu başka türlü alınamıyor:
    // tohumdaki doctor@demo.com DOĞRULANMAMIŞ, dolayısıyla yayınlama ve
    // randevu onaylama gibi akışlar onunla sınanamıyor.
    //
    // Demo girişi CANLIDA KAPALI (ölçüldü: 404) ve öyle kalmalı — süper
    // yönetici olmayan rollere bile şifresiz kapı açmak canlıda kabul
    // edilemez. Bu yüzden bu oturumlar YEREL yığına karşı alınıyor:
    //
    //   E2E_API_ORIGIN=http://127.0.0.1:8001 \
    //   E2E_DEMO_KEY=... \
    //   E2E_BASE_URL=http://127.0.0.1:3100 npx playwright test
    //
    // Değişkenler yoksa hiçbir şey yapılmaz ve o testler atlanır.
    const apiKok = process.env.E2E_API_ORIGIN || '';
    const demoAnahtar = process.env.E2E_DEMO_KEY || '';

    if (!apiKok) {
      console.warn(
        'Demo oturumları alınmadı: E2E_API_ORIGIN tanımlı değil.\n' +
        '  Doğrulanmış hekim/klinik testleri ATLANACAK. Yerel yığın için docs/YEREL-TEST.md.',
      );
    } else {
      // Yerel kipte `hasta` ve `doktor` adları da buradan doluyor: mevcut
      // spec'ler bu adlarla oturum istiyor ve parola girişi yerelde yok.
      const uretilecek = yerelKip
        ? [['hasta', 'hasta'], ['doktor', 'doktor'], ['klinik', 'klinik'],
           ['demoDoktor', 'doktor'], ['demoKlinik', 'klinik']]
        : [['demoDoktor', 'doktor'], ['demoKlinik', 'klinik']];

      for (const [rol, yol] of uretilecek) {
        try {
          // Uç JSON değil YÖNLENDİRME döndürüyor; jeton adresin sorgu
          // dizesinde geliyor. Yönlendirme hedefi ortama göre değiştiği için
          // ona güvenmeyip jetonu doğrudan okuyoruz.
          const adres = `${apiKok}/api/demo-login/${yol}` + (demoAnahtar ? `?key=${encodeURIComponent(demoAnahtar)}` : '');
          const yanit = await fetch(adres, { redirect: 'manual' });
          const hedef = yanit.headers.get('location') || (await yanit.text());
          const eslesme = hedef.match(/demo_token=([^&"'\s]+)/);

          if (!eslesme) {
            console.warn(`Demo oturumu alınamadı (${rol}): jeton bulunamadı, HTTP ${yanit.status}`);
            continue;
          }

          const jeton = decodeURIComponent(eslesme[1]);

          // Kullanıcı nesnesi arayüzün beklediği biçimde gerekiyor.
          const benYanit = await fetch(`${apiKok}/api/auth/me`, {
            headers: { Authorization: `Bearer ${jeton}`, Accept: 'application/json' },
          });
          const ben = await benYanit.json();
          const kullanici = ben?.data || ben?.user || ben;

          const context = await browser.newContext({ baseURL });
          const page = await context.newPage();
          await page.goto('/tr');
          await page.evaluate(({ kullanici, jeton }) => {
            localStorage.setItem('auth_state', JSON.stringify({ user: kullanici, token: jeton, country: 'TR' }));
            localStorage.setItem('auth_remember', '1');
            localStorage.removeItem('auth_logout');
            localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary: true, analytics: false, personalization: false }));
          }, { kullanici, jeton });

          await context.storageState({ path: oturumDosyasi(rol) });
          await context.close();
          console.log(`Demo oturumu hazır: ${rol} (${kullanici?.role_id ?? '?'})`);
        } catch (e) {
          console.warn(`Demo oturumu alınamadı (${rol}):`, e.message);
        }
      }
    }
  } finally {
    await browser.close();
  }
};

module.exports.oturumDosyasi = oturumDosyasi;
module.exports.HESAPLAR = HESAPLAR;
