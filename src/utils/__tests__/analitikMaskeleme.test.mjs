import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Google Analytics'e hasta bağlamlı tekil adres GİTMEMELİ.
 *
 * `redactPath` bunun için var: /tr/doctor/123 → /tr/doctor/[id]. Ama dil öneki
 * kendi içinde listeleniyordu:
 *
 *     const LOCALE_PREFIX = /^\/(tr|en|de|ar|ru)(?=\/|$)/;
 *
 * Uygulamaya sonradan dört dil eklendi (fr, es, it, az) ve bu satır
 * güncellenmedi. O dillerde önek soyulmuyor, dolayısıyla `^/doctor/...` ile
 * başlayan kuralların hiçbiri eşleşmiyor ve TAM adres gidiyordu:
 *
 *     /fr/doctor/123           → /fr/doctor/123
 *     /fr/crm/patient-360/9001 → /fr/crm/patient-360/9001
 *
 * Yani bir hastanın CRM kaydının kimliği, Fransızca arayüz kullanan bir
 * kullanıcıda üçüncü tarafa gidiyordu. Sessiz: ne hata, ne uyarı.
 *
 * İki değişiklik yapıldı. Dil listesi `lib/locales`ten geliyor — tek doğru
 * kaynak. Ve maskeleme artık HATAYA-KAPALI: tanınmayan bir rotada kimlik gibi
 * duran segment de maskeleniyor, çünkü eski tasarımda yeni bir dinamik rota
 * eklemek sessizce yeni bir sızıntı açıyordu.
 *
 * Onay mekanizmasının kendisi ayrıca ÇALIŞIRKEN ölçüldü (sahte bir GA kimliğiyle
 * derlenip tarayıcıda, istekler ağa çıkmadan durdurularak):
 *
 *     seçim yapılmadan        izleme isteği 0   window.gtag undefined
 *     "Tümünü Reddet" sonrası izleme isteği 0   window.gtag undefined
 *     "Tümünü Kabul Et"       izleme isteği 1   window.gtag function
 *
 * Yani reddetme gerçekten durduruyor; sorun onayda değil, onay verildikten
 * sonra GÖNDERİLEN adresteydi.
 *
 * Bu dosya `app/Analytics.jsx` içindeki işlevi kaynaktan okuyup çalıştırıyor:
 * dosya `'use client'` ve `next/script` içe aktardığı için düz `import`
 * edilemiyor.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const kaynak = readFileSync(path.join(uygulamaKok, 'app/Analytics.jsx'), 'utf8');
const { LOCALES } = await import(path.join(uygulamaKok, 'src/lib/locales.js'));

/** `redactPath`i bağımlılıklarıyla birlikte kaynaktan kur. */
const redactPath = await (async () => {
  const bas = kaynak.indexOf('const DINAMIK_ROTALAR');
  const son = kaynak.indexOf('export default function Analytics');

  assert.ok(bas > 0 && son > bas, 'Analytics.jsx beklenen yapıda değil');

  const govde = kaynak
    .slice(bas, son)
    .replace(/export function/g, 'function');

  const yap = new Function('isLocale', `${govde}\nreturn redactPath;`);

  return yap((x) => LOCALES.includes(x));
})();

/** Maskelenmiş yolda kimlik kalmış mı? */
function sizdiMi(yol) {
  return yol
    .split('/')
    .some((s) => /^\d{2,}$/.test(s) || /^[0-9a-f]{16,}$/i.test(s));
}

test('dil listesi kaynağın kendisinden geliyor, kopyalanmıyor', () => {
  // Asıl hata buydu: iki liste ayrıştı ve kimse fark etmedi.
  assert.match(kaynak, /from '@\/lib\/locales'/, 'dil listesi `lib/locales`ten alınmıyor');
  assert.doesNotMatch(
    kaynak.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((s) => !s.trim().startsWith('//')).join('\n'),
    /\(tr\|en\|de\|ar\|ru\)/,
    'dil listesi yeniden kopyalanmış: yeni dil eklendiğinde sessizce sızar',
  );
});

test('her dilde hasta bağlamlı kimlik maskeleniyor', () => {
  const sizanlar = [];

  for (const dil of LOCALES) {
    for (const yol of [
      `/${dil}/doctor/123`,
      `/${dil}/clinic/42`,
      `/${dil}/post/98`,
      `/${dil}/appointment/55`,
      `/${dil}/telehealth/7331`,
      `/${dil}/crm/patient-360/9001`,
      `/${dil}/crm/patient/4242`,
    ]) {
      const sonuc = redactPath(yol);
      if (sizdiMi(sonuc)) sizanlar.push(`${yol} → ${sonuc}`);
    }
  }

  assert.deepEqual(
    sizanlar,
    [],
    'Bu adresler Google Analytics\'e olduğu gibi gidiyor. Sağlık bağlamında\n'
      + 'tekil kimlik üçüncü tarafa aktarılmış olur (KVKK/GDPR).',
  );
});

test('bilinmeyen bir dinamik rota da sızdırmıyor', () => {
  // Eski tasarım hataya-AÇIKTI: listede olmayan rota tam yol olarak gidiyordu.
  // Yeni bir dinamik rota eklerken kimsenin aklına analitik gelmez.
  for (const yol of ['/tr/yeni-modul/8812', '/fr/dosya/00e1f2a3b4c5d6e7f8', '/az/rapor/2024001']) {
    const sonuc = redactPath(yol);

    assert.ok(!sizdiMi(sonuc), `${yol} → ${sonuc} — bilinmeyen rotada kimlik geçti`);
  }
});

test('dil öneki ve okunur segmentler korunuyor', () => {
  // Fazla maskeleme de zarar: analitik işe yaramaz hâle gelir.
  assert.equal(redactPath('/tr/doctor/123'), '/tr/doctor/[id]');
  assert.equal(redactPath('/fr/tedaviler/kardiyoloji/istanbul'), '/fr/tedaviler/[specialty]/[city]');
  assert.equal(redactPath('/en/about'), '/en/about');
  assert.equal(redactPath('/tr'), '/tr');
  assert.equal(redactPath('/doctor/123'), '/doctor/[id]');
});

test('onay olmadan hiçbir script yüklenmiyor', () => {
  // Maskeleme, izin verilmemişse zaten devreye girmiyor olmalı.
  assert.match(kaynak, /const analyticsAllowed = hasConsent\('analytics'\)/, 'analitik onayı okunmuyor');
  assert.match(kaynak, /if \(!enabled\) return null;/, 'onay yokken bileşen script render edebiliyor');
});
