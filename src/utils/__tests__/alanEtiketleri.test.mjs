import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Form alanlarının ekran okuyucuya söyleyeceği bir adı olmalı.
 *
 * Ölçüldü: on herkese açık sayfada yirmi beş görünür alanın on üçünde
 * erişilebilir ad yoktu — yalnız yer tutucu metni vardı. Yer tutucu ad yerine
 * geçmez: odaklanınca ve yazmaya başlayınca kaybolur, WCAG onu etiket saymaz.
 * `<select>` alanlarında ise yer tutucu diye bir şey de yok; okunacak hiçbir
 * şey kalmıyordu.
 *
 * Hepsi sitenin ana işlevindeydi:
 *
 *   ana sayfa      belirti, uzmanlık ve klinik/doktor arama kutuları
 *   /search        metin kutusu + altı süzgeç (uzmanlık, şehir, dil, puan)
 *   /browse/*      klinik ve tedavi arama kutuları
 *   /medstream     akışta arama
 *   /vasco-ai      şikâyet metni — yapay zekâ yönlendirmesinin girdisi
 *
 * İki ayrı hata vardı, ikisi de gözle bakınca DOĞRU görünüyor:
 *
 *   1. `/search` süzgeçlerinin üstünde `<label>` VAR ama `htmlFor` yok ve
 *      `<select>` etiketin içinde değil, kardeşi. Yani ekranda etiketli,
 *      programatik olarak adsız.
 *
 *   2. Ana sayfada `aria-label` bir BİLEŞENE (`GlobalSuggest`) prop olarak
 *      veriliyordu. Özel prop kendiliğinden `<input>`a inmez; değer hiçbir yere
 *      ulaşmıyordu. Bileşen artık iletiyor.
 *
 * Düzeltmeden sonra aynı ölçüm: yirmi beş alan, sıfır adsız.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklamalar `aria-label` ifadesini METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .join('\n');
}

test('öneri kutusu erişilebilir adı input\'a iletiyor', () => {
  // Asıl tuzak buydu: çağıran taraf `aria-label` yazıyor, bileşen onu
  // kullanmıyor, kimse fark etmiyor.
  const kaynak = yorumsuz(oku('src/components/forms/GlobalSuggest.jsx'));

  assert.match(kaynak, /'aria-label':\s*ariaLabel/, 'GlobalSuggest `aria-label` propunu almıyor');
  assert.match(kaynak, /aria-label=\{ariaLabel \|\| placeholder\}/, 'alınan ad `<input>`a verilmiyor');
});

test('arama süzgeçleri etiketleriyle bağlı', () => {
  // `<label>` ile `<select>` kardeşse ekranda etiketli, ekran okuyucuda adsız
  // olur. `htmlFor`/`id` çifti hem adı verir hem etiketi tıklanabilir yapar.
  const kaynak = yorumsuz(oku('src/screens/SearchResults.jsx'));

  for (const kimlik of ['suzgec-uzmanlik', 'suzgec-sehir', 'suzgec-dil', 'suzgec-puan']) {
    assert.match(kaynak, new RegExp(`htmlFor="${kimlik}"`), `${kimlik} için etiket bağlanmamış`);
    assert.match(kaynak, new RegExp(`id="${kimlik}"`), `${kimlik} alanı yok`);
  }
});

test('herkese açık arama alanlarının adı var', () => {
  // Her biri ekranda ölçülerek bulundu; kaynakta sabitleniyor ki geri gitmesin.
  const beklenen = [
    ['src/components/search/CustomSearch.jsx', /aria-label=\{t\('search\.symptomPlaceholder'\)\}/],
    ['src/components/search/CustomSearch.jsx', /aria-label=\{t\('search\.specialtyPlaceholder'\)\}/],
    ['src/components/search/GlobalSearch.jsx', /aria-label=\{t\('search\.clinicsOrDoctorsPlaceholder'\)\}/],
    ['src/components/timeline/TimelineFilterSidebar.jsx', /aria-label=\{t\('medstream\.searchInTimeline'\)\}/],
    ['src/screens/BrowseClinics.jsx', /aria-label=\{t\('browse\.searchClinics'/],
    ['src/screens/BrowseTreatments.jsx', /aria-label=\{t\('browse\.searchTreatments'/],
    ['src/screens/VascoAIPage.jsx', /aria-label=\{t\('vascoAI\.inputLabel'/],
  ];

  for (const [dosya, desen] of beklenen) {
    assert.match(yorumsuz(oku(dosya)), desen, `${dosya}: erişilebilir ad kaldırılmış`);
  }
});

test('Vasco alanının adı değişken yer tutucuya bağlı değil', () => {
  // Oradaki yer tutucu animasyonlu: yazı yazıldıkça örnek metinler dönüyor ve
  // odaklanınca kayboluyor. Ad sabit bir anahtardan gelmeli.
  const kaynak = yorumsuz(oku('src/screens/VascoAIPage.jsx'));

  assert.doesNotMatch(kaynak, /aria-label=\{animPh/, 'ad animasyonlu yer tutucudan alınıyor');
  assert.match(kaynak, /aria-label=\{t\('vascoAI\.inputLabel'/, 'sabit ad anahtarı kullanılmıyor');
});
