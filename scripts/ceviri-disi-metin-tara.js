#!/usr/bin/env node
/**
 * ÇEVİRİDEN HİÇ GEÇMEYEN METİNLERİ BULUR.
 *
 * Ekranın yarı Türkçe yarı İngilizce görünmesinin iki ayrı sebebi olabilir:
 *
 *   1. Anahtar çağrılıyor ama çeviri dosyasında yok → İngilizce'ye düşüyor.
 *   2. Metin doğrudan koda yazılmış, çeviriden HİÇ geçmiyor.
 *
 * İkincisi çeviri dosyalarına bakarak bulunamaz — dosyalar eksiksiz görünür.
 * Randevu ekranında tam olarak bu oldu: 25 anahtarın Türkçesi kusursuzdu,
 * ama 27 metin hiç anahtar kullanmıyordu.
 *
 * Bu betik kaynağı tarar ve ekrana basılan ama t() kullanmayan İngilizce
 * metinleri listeler. Tarayıcı gerekmez, oturum arkasındaki ekranlar da
 * kapsanır.
 *
 * Kullanım:  node scripts/ceviri-disi-metin-tara.js [--json]
 */

const fs = require('fs');
const path = require('path');

const KOK = path.join(__dirname, '..', 'src');

/** Çeviri gerektirmeyen, ekranda görünse de dile bağlı olmayan metinler. */
const YOK_SAY = [
  /^[A-Z]{2,6}$/,                 // kısaltma: PDF, HD, GDPR, TR
  /^[\d\s.,:/%+()-]+$/,           // sayı ve noktalama
  /^(Visa|Mastercard|MedStream|Medagama|Vasco|WhatsApp|Google|YouTube|Zoom|E-Nabız|Medula|MHRS)/i,
  /^https?:/,
  /^[a-z]+([A-Z][a-z]+)+$/,       // deveKamburu tanımlayıcı
  /^\s*$/,
  // Çeviri anahtarının KENDİSİ. Bazı ekranlar anahtarı bir dizide tutup
  // çeviriyi başka satırda yapıyor — bunlar zaten çeviriden geçiyor.
  /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+)+$/,
  /^[./#]/,                       // yol, css sınıfı
  /@/,                            // e-posta örneği (ör. doctor@example.com)
];

/** İngilizce olduğuna işaret eden yaygın kelimeler. */
const INGILIZCE = new RegExp(
  '\\b(' + [
    'the', 'and', 'or', 'your', 'you', 'is', 'are', 'was', 'will', 'be', 'been',
    'to', 'of', 'for', 'from', 'with', 'without', 'this', 'that', 'these',
    'not', 'no', 'yes', 'all', 'any', 'more', 'less', 'new', 'add', 'edit',
    'delete', 'remove', 'save', 'cancel', 'close', 'open', 'search', 'filter',
    'select', 'choose', 'submit', 'send', 'sent', 'confirm', 'confirmed',
    'loading', 'error', 'failed', 'success', 'please', 'try', 'again',
    'appointment', 'appointments', 'doctor', 'doctors', 'patient', 'patients',
    'clinic', 'clinics', 'hospital', 'invoice', 'invoices', 'payment',
    'summary', 'details', 'date', 'time', 'type', 'name', 'email', 'phone',
    'settings', 'profile', 'dashboard', 'report', 'reports', 'review',
    'reviews', 'message', 'messages', 'notification', 'notifications',
    'available', 'unavailable', 'verified', 'pending', 'completed', 'upcoming',
    'visit', 'video', 'consultation', 'quality', 'protection', 'compliant',
    'licensed', 'professionals', 'booking', 'session', 'link', 'before',
    'after', 'today', 'yesterday', 'tomorrow', 'week', 'month', 'year',
  ].join('|') + ')\\b',
  'i',
);

/** Türkçeye özgü harfler — metin zaten Türkçeyse çeviri sorunu yok. */
const TURKCE_HARF = /[ışğİŞĞçöüÇÖÜ]/;

function jsxDosyalari(dizin, liste = []) {
  for (const ad of fs.readdirSync(dizin)) {
    const tam = path.join(dizin, ad);
    const st = fs.statSync(tam);
    if (st.isDirectory()) {
      if (ad === 'node_modules' || ad === 'i18n' || ad === 'data') continue;
      jsxDosyalari(tam, liste);
    } else if (/\.jsx?$/.test(ad)) {
      liste.push(tam);
    }
  }
  return liste;
}

function suphelendir(metin) {
  const m = metin.trim();
  if (m.length < 3 || m.length > 90) return false;
  if (YOK_SAY.some((k) => k.test(m))) return false;
  if (TURKCE_HARF.test(m)) return false;
  if (!/[A-Za-z]/.test(m)) return false;
  return INGILIZCE.test(m);
}

const bulgular = [];

for (const dosya of jsxDosyalari(KOK)) {
  const satirlar = fs.readFileSync(dosya, 'utf8').split('\n');
  satirlar.forEach((satir, i) => {
    // t() geçen satır zaten çeviriden geçiyor (yedek metni İngilizce olabilir).
    if (/\bt\(/.test(satir)) return;
    // labelKey/titleKey taşıyan satırdaki "label" alanı YEDEK metindir; çeviri
    // anahtar üzerinden yapılıyor. Bunu bulgu saymak gürültü üretiyordu.
    if (/\b(labelKey|titleKey)\s*:/.test(satir)) return;
    // Yorum satırları
    if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(satir)) return;
    // import / export / console
    if (/^\s*(import|export|console\.)/.test(satir)) return;

    const adaylar = [];

    // 1) JSX metin düğümü:  >Metin<
    const jsx = satir.match(/>\s*([A-Za-z][^<>{}\n]{2,89})\s*</);
    if (jsx) adaylar.push(jsx[1]);

    // 2) Ekranda görünen prop'lar
    for (const m of satir.matchAll(/\b(label|title|desc|description|placeholder|heading|subtitle|text|emptyText|tooltip)\s*[:=]\s*['"]([^'"]{3,89})['"]/g)) {
      adaylar.push(m[2]);
    }

    for (const aday of adaylar) {
      if (suphelendir(aday)) {
        bulgular.push({
          dosya: path.relative(path.join(__dirname, '..'), dosya),
          satir: i + 1,
          metin: aday.trim(),
        });
      }
    }
  });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(bulgular, null, 2));
  process.exit(0);
}

const dosyaBasina = new Map();
for (const b of bulgular) {
  if (!dosyaBasina.has(b.dosya)) dosyaBasina.set(b.dosya, []);
  dosyaBasina.get(b.dosya).push(b);
}

const sirali = [...dosyaBasina.entries()].sort((a, b) => b[1].length - a[1].length);

console.log(`Çeviriden geçmeyen metin: ${bulgular.length} (${dosyaBasina.size} dosya)\n`);
for (const [dosya, liste] of sirali) {
  console.log(`${String(liste.length).padStart(3)}  ${dosya}`);
}
console.log('\nAyrıntı için: node scripts/ceviri-disi-metin-tara.js --json');
