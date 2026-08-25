import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Uydurma veri kullanıcıya — ve arama motoruna — gösterilmemeli.
 *
 * Ana sayfanın klinik listesi `useState(FALLBACK_20)` ile başlıyordu. O liste
 * gerçek hastane adlarını uydurulmuş puan ve yorum sayılarıyla taşıyordu:
 *
 *     { name: 'Memorial Hospital', city: 'Ankara', rating: 4.9, reviews: 186 }
 *     { name: 'Ege University Hospital', … rating: 4.7, reviews: 428 }
 *
 * Başlangıç durumu olduğu için API cevap vermeden ÖNCE ekrandaydı ve sunucudan
 * gelen HTML'e giriyordu. Ölçüldü: arama motorunun gördüğü HTML bu adları
 * içeriyordu — API sağlamken bile. API çökerse `catch` sessiz olduğu için
 * kalıcı olarak duruyorlardı.
 *
 * Gerçek bir sağlık kuruluşunun adını uydurulmuş bir puanla yan yana koymak
 * yanlış veriden fazlası. Adlar ve puanlar kaldırıldı; yalnız kart görselleri
 * kaldı — onlar zaten yer tutucu.
 *
 * `/doctors-departments` ayrı bir durum: ekran hiçbir API'ye bağlanmıyor, tüm
 * doktorları, puanları (4.8 / 210 yorum) ve fiyatları (800₺, 1200₺) sabit
 * yazılmış. Üstverisi ise sayfayı gerçek bir dizin gibi tanıtıyor ve site
 * haritasında dokuz dilde duruyordu. Gerçek veriye bağlanana kadar arama
 * motorlarına sunulmuyor. Bu geçici bir örtü — asıl iş sayfayı veriye bağlamak.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklamalar uydurma adları METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .join('\n');
}

test('ana sayfa uydurma klinik adı ve puanı taşımıyor', () => {
  const home = yorumsuz(oku('src/screens/HomeV2.jsx'));

  for (const ad of ['Memorial Hospital', 'Ege University Hospital', 'Acibadem Hospital', 'AestheticPlus', 'MedPark Clinic']) {
    assert.ok(
      !home.includes(ad),
      `HomeV2 hâlâ "${ad}" taşıyor: sunucudan gelen HTML'e girer ve indekslenir`,
    );
  }

  assert.doesNotMatch(home, /rating:\s*4\.\d/, 'uydurma puan geri gelmiş');
  assert.doesNotMatch(home, /reviews:\s*\d{2,}/, 'uydurma yorum sayısı geri gelmiş');
});

test('klinik listesi boş başlıyor', () => {
  // Uydurma bir başlangıç değeri, veriden ÖNCE ekranda olur — ve sunucu
  // render'ına da girer. Doğru başlangıç boş liste.
  const home = yorumsuz(oku('src/screens/HomeV2.jsx'));

  assert.match(home, /const \[clinics, setClinics\] = useState\(\[\]\)/, 'klinik listesi boş başlamıyor');
});

test('klinik isteği başarısız olursa sessiz kalmıyor', () => {
  // Eski hâli `.catch(() => {})` idi: kesinti kullanıcıya hiç belli olmuyordu,
  // çünkü ekranda zaten uydurma klinikler duruyordu.
  const home = yorumsuz(oku('src/screens/HomeV2.jsx'));

  assert.doesNotMatch(home, /\.catch\(\(\) => \{\}\);\s*\n\s*\}, \[geoCountry/, 'klinik hatası sessizce yutuluyor');
  assert.match(home, /setKlinikHatasi\(true\)/, 'hata durumu tutulmuyor');
  assert.match(home, /common\.loadFailedTitle/, 'hata ekranda gösterilmiyor');
});

test('sunucu çökünce "sonuç yok" denmiyor', () => {
  // Ölçüldü: API 500 dönerken /tr/medstream "Gönderi bulunamadı —
  // filtrelerinizi değiştirin", /tr/browse/clinics ise "Klinik bulunamadı —
  // farklı bir arama deneyin" diyordu. İkisi de kullanıcının kendi hatası gibi
  // okunuyordu.
  for (const [dosya, ad] of [
    ['src/screens/ExploreTimeline.jsx', 'medstream'],
    ['src/screens/BrowseClinics.jsx', 'klinik listesi'],
  ]) {
    const kaynak = yorumsuz(oku(dosya));

    assert.match(kaynak, /baglantiHatasi/, `${ad}: hata ile boşluk hâlâ ayrılmıyor`);
    assert.match(kaynak, /common\.loadFailedTitle/, `${ad}: hata ekranı yok`);
    assert.match(kaynak, /common\.retry/, `${ad}: yeniden deneme yolu yok`);
  }
});

test('sahte veriyle çalışan sayfa arama motoruna sunulmuyor', () => {
  const sayfa = oku('app/[locale]/doctors-departments/page.jsx');
  const harita = yorumsuz(oku('app/sitemap.js'));

  assert.match(sayfa, /robots:\s*\{\s*index:\s*false/, 'sayfa indekslemeye açık');
  assert.ok(!harita.includes("'/doctors-departments'"), 'site haritasına geri eklenmiş');

  // Örtü kaldırılacaksa ekranın gerçek veriye bağlanmış olması gerekir.
  const ekran = oku('src/screens/DoctorsDepartments.jsx');
  const veriyeBagli = /API\.|axios|fetch\(/.test(ekran);

  assert.ok(
    !veriyeBagli,
    'Ekran artık veri çekiyor gibi görünüyor. Öyleyse sayfa yeniden\n'
      + 'indekslenebilir: `robots` satırını ve site haritası kaydını geri alın,\n'
      + 'sonra bu ölçütü güncelleyin.',
  );
});

test('robots ayarı sessizce yok sayılmıyor', () => {
  // `buildMetadata` `robots` anahtarını tanımıyordu: çağıran taraf yazıyordu,
  // hiçbir şey olmuyordu, sayfa indekslenmeye devam ediyordu. Yok sayılan bir
  // indeksleme ayarı, olmayan bir ayardan daha tehlikeli.
  const seo = oku('src/lib/seo-server.js');

  assert.match(seo, /export function buildMetadata\(\{[^}]*robots[^}]*\}\)/, 'buildMetadata robots almıyor');
  assert.match(seo, /\.\.\.\(robots && \{ robots \}\)/, 'robots döndürülen üstveriye eklenmiyor');
});
