import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Klinik sayfası, o kliniğin sunmadığı hizmeti ve vermediği fiyatı yazmamalı.
 *
 * Sayfanın kimliği (ad, adres, doktorlar) API'den geliyordu; hizmetler,
 * fiyatlar, galeri ve "öncesi/sonrası" ise `data/clinicMockData.js` dosyasından.
 * Klinik adı gerçek olduğu için uydurma içerik o kliniğin BEYANI gibi
 * okunuyordu. Ölçüldü — "Beyaz Diş Ağız ve Diş Sağlığı" adlı bir DİŞ
 * kliniğinin sayfasında yan sütun şunu yazıyordu:
 *
 *     Kalp Cerrahisi     ₺50K - ₺150K
 *     Onkoloji Tedavi    ₺30K - ₺200K
 *
 * Fiyat sekmesinde "Coronary Artery Bypass (CABG) $15,000 - $25,000", öncesi/
 * sonrası sekmesinde burun estetiği ve saç ekimi "sonuçları" (aslında stok
 * fotoğraflar), konum sekmesinde ise adres boşsa sabit bir İstanbul adresi
 * vardı — hastayı yanlış yere gönderebilecek bir yedek.
 *
 * Yerel veritabanındaki on üç kliniğin HİÇBİRİNDE bu alanlar dolu değildi, yani
 * uydurma içerik istisna değil kuraldı: her klinik sayfası öyle açılıyordu.
 *
 * API alanları zaten var (`services`, `price_ranges`, `gallery`); yalnızca boş
 * geliyorlardı. Doğru davranış boş bırakmak — ve verisi olmayan sekmeyi hiç
 * göstermemek, çünkü boş bir "Öncesi/Sonrası" sekmesi kliniğin sonuç
 * paylaşmadığını değil, sayfanın bozuk olduğunu düşündürür.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const sayfa = readFileSync(path.join(uygulamaKok, 'src/screens/ClinicDetailPage.jsx'), 'utf8');

/** Yorumsuz kaynak — açıklama yorumu uydurma değerleri METİN olarak taşıyor. */
const kod = sayfa
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((s) => !s.trim().startsWith('//'))
  .join('\n');

test('sayfa sahte içerik dosyasından yalnız sekme listesini alıyor', () => {
  // Desen SATIRA sabitli: `[\s\S]*?` kullanan hâli dosyadaki İLK `import {`
  // ifadesinden başlayıp buraya kadar her şeyi yutuyordu.
  const ithal = kod.match(/^import \{([^}]*)\} from '\.\.\/data\/clinicMockData'/m);

  assert.ok(ithal, 'clinicMockData içe aktarımı bulunamadı — bu ölçüt güncellenmeli');

  const adlar = ithal[1].split(',').map((x) => x.trim()).filter(Boolean);

  assert.deepEqual(
    adlar,
    ['tabsConfig'],
    'Sayfa yeniden sahte içerik çekiyor. `tabsConfig` dışındaki her şey o\n'
      + 'kliniğin beyanı gibi görünür: sunmadığı hizmet, vermediği fiyat.',
  );
});

test('fiyat, hizmet ve galeri gerçek klinikten geliyor', () => {
  assert.match(kod, /apiClinic\?\.price_ranges/, 'fiyat listesi API alanından okunmuyor');
  assert.match(kod, /apiClinic\?\.services/, 'hizmetler API alanından okunmuyor');
  assert.doesNotMatch(kod, /\bpriceRangesData\b/, 'uydurma fiyat listesi geri gelmiş');
  assert.doesNotMatch(kod, /\bservicesData\b/, 'uydurma hizmet listesi geri gelmiş');
  assert.doesNotMatch(kod, /\bgalleryData\b/, 'uydurma galeri geri gelmiş');
  assert.doesNotMatch(kod, /\bbeforeAfterData\b/, 'uydurma öncesi/sonrası geri gelmiş');
});

test('adres boşsa uydurma bir adrese düşülmüyor', () => {
  // Sabit bir İstanbul adresi, hastayı yanlış yere gönderir.
  assert.doesNotMatch(kod, /Cumhuriyet Mah/, 'sabit adres yedeği geri gelmiş');
  assert.match(kod, /locationAddress=\{apiClinic\?\.address \|\| ''\}/, 'adres alanı doğrudan API\'den okunmuyor');
});

test('verisi olmayan sekme gösterilmiyor', () => {
  assert.match(kod, /const gorunurSekmeler = tabsConfig\.filter/, 'sekmeler süzülmüyor');
  assert.match(kod, /gorunurSekmeler\.map/, 'süzülmüş liste render edilmiyor');

  // Varsayılan sekme her zaman görünenlerden biri olmalı; aksi hâlde sayfa
  // hiçbir şey seçili olmadan açılır.
  assert.match(kod, /useState\('genel-bakis'\)/, 'varsayılan sekme değişmiş — süzgeçte her zaman görünür olduğundan emin olun');
});

test('yönetici finans ekranı örnek veri olduğunu söylüyor', () => {
  // Ekranın hiçbir API çağrısı yok: 12.450 dolar gelir, 47 abone ve adıyla
  // sanıyla on beş doktor uydurma — üstelik CSV olarak dışa aktarılabiliyor,
  // yani sayılar uygulamadan çıkıp kaynağını kaybedebiliyor.
  const finans = readFileSync(path.join(uygulamaKok, 'src/screens/admin/AdminFinancials.jsx'), 'utf8');

  const veriyeBagli = /API\.|axios|fetch\(/.test(finans);

  if (veriyeBagli) {
    // Gerçek uçlara bağlanmışsa uyarı kalkmalı — kalırsa yanlış bilgi verir.
    assert.doesNotMatch(finans, /demoDataTitle/, 'ekran veriye bağlanmış ama "örnek veri" uyarısı duruyor');
    return;
  }

  assert.match(finans, /adminFinancials\.demoDataTitle/, 'uydurma sayılar uyarısız gösteriliyor');
  assert.match(finans, /adminFinancials\.demoDataHint/, 'CSV uyarısı yok');
});
