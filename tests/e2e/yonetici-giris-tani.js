#!/usr/bin/env node
/**
 * YÖNETİCİ GİRİŞİ NEDEN OLMUYOR — teşhis.
 *
 * Oturum dosyası oluşmuyor ama terminaldeki hata satırı bize ulaşmıyor.
 * Bu betik girişi dener ve SONUCU bir dosyaya yazar; parola dosyaya
 * yazılmaz, yalnızca HTTP durumu ve sunucunun döndürdüğü alan adları
 * kaydedilir.
 *
 * Kullanım:
 *   E2E_ADMIN_EMAIL='...' E2E_ADMIN_PASSWORD='...' node tests/e2e/yonetici-giris-tani.js
 *
 * Sonuç:  tests/e2e/.oturum/tani.txt
 */

const fs = require('fs');
const path = require('path');

const TABAN = process.env.E2E_BASE_URL || 'https://med-gama.vercel.app';

const KLASOR = path.join(__dirname, '.oturum');
fs.mkdirSync(KLASOR, { recursive: true });
const CIKTI = path.join(KLASOR, 'tani.txt');

const yaz = (satirlar) => {
  fs.writeFileSync(CIKTI, satirlar.join('\n') + '\n');
  console.log(satirlar.join('\n'));
  console.log(`\n→ Sonuç yazıldı: ${CIKTI}`);
};

(async () => {
  const email = process.env.E2E_ADMIN_EMAIL || '';
  const sifre = process.env.E2E_ADMIN_PASSWORD || '';

  const rapor = [];
  rapor.push(`taban adres      : ${TABAN}`);
  rapor.push(`e-posta verildi  : ${email ? 'evet (' + email.replace(/^(.).*(@.*)$/, '$1***$2') + ')' : 'HAYIR'}`);
  rapor.push(`parola verildi   : ${sifre ? 'evet (' + sifre.length + ' karakter)' : 'HAYIR'}`);

  if (!email || !sifre) {
    rapor.push('');
    rapor.push('SONUÇ: Ortam değişkenleri komuta geçmemiş.');
    rapor.push('Kabuk tırnakları bozulmuş olabilir. Değişkenleri komutun BAŞINA,');
    rapor.push('tek tırnak içinde yazın:');
    rapor.push("  E2E_ADMIN_EMAIL='adres' E2E_ADMIN_PASSWORD='parola' node tests/e2e/yonetici-giris-tani.js");
    return yaz(rapor);
  }

  try {
    const r = await fetch(`${TABAN}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password: sifre }),
    });

    const metin = await r.text();
    let j = null;
    try { j = JSON.parse(metin); } catch { /* JSON değil */ }

    rapor.push(`HTTP durumu      : ${r.status}`);
    rapor.push(`hata alanları    : ${JSON.stringify(Object.keys(j?.errors || {}))}`);
    rapor.push(`sunucu mesajı    : ${String(j?.message || metin.slice(0, 120)).slice(0, 160)}`);

    const rol = j?.data?.role_id || j?.user?.role_id;
    const jeton = j?.token || j?.data?.token;
    rapor.push(`dönen rol        : ${rol || '-'}`);
    rapor.push(`jeton geldi mi   : ${jeton ? 'evet' : 'hayır'}`);
    rapor.push('');

    if (r.status === 200 && jeton) {
      if (['superAdmin', 'saasAdmin'].includes(rol)) {
        rapor.push('SONUÇ: Giriş BAŞARILI ve hesap yönetici. Kurulum bu hesapla oturum açabilir.');
      } else {
        rapor.push(`SONUÇ: Giriş başarılı AMA hesabın rolü "${rol}" — yönetici değil.`);
        rapor.push('Yönetim paneli bu hesapla açılmaz; superAdmin yetkili bir hesap gerekiyor.');
      }
    } else if (r.status === 422) {
      rapor.push('SONUÇ: E-posta veya parola hatalı.');
    } else if (r.status === 429) {
      rapor.push('SONUÇ: Çok fazla deneme yapıldı. Bir dakika bekleyip tekrar deneyin.');
    } else if (r.status >= 500) {
      rapor.push('SONUÇ: Arka uç şu an yanıt veremiyor (uykuda olabilir). Tekrar deneyin.');
    } else {
      rapor.push('SONUÇ: Beklenmedik yanıt. Yukarıdaki satırları paylaşın.');
    }
  } catch (e) {
    rapor.push(`bağlantı hatası  : ${e.message}`);
    rapor.push('');
    rapor.push('SONUÇ: Sunucuya hiç ulaşılamadı (ağ ya da adres sorunu).');
  }

  yaz(rapor);
})();
