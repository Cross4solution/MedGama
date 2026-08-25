import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Ön yüzün gönderdiği süzgeç adı, arka ucun tanıdığı ad olmalı.
 *
 * Klinik listesi arama kutusu HİÇBİR ŞEY yapmıyordu. Ön yüz `search` diye bir
 * parametre gönderiyor, `/api/clinics` ise `name`, `city`, `specialty` ve
 * `treatment_tag_id` tanıyor. Tanınmayan parametre sessizce düşüyor: istek 200
 * dönüyor, tam liste geliyor, hiçbir yerde uyarı yok.
 *
 * Ölçüldü — "zzzqqqxyz" araması on üç kliniğin hepsini gösteriyordu. Üstelik
 * sonuç boş kalsaydı ekranda "farklı bir arama deneyin" yazacaktı; hiç süzmeyen
 * bir süzgeç için verilmiş bir öğüt.
 *
 * Düzeltmeden sonra aynı kutu: "Beyaz" → bir klinik, "zzzqqqxyz" → sıfır, ve
 * aksansız "Sagligi" → "Beyaz Diş Ağız ve Diş Sağlığı" ile "Minik Adımlar Çocuk
 * Sağlığı". Arka uçtaki Türkçe normalleştirme zaten çalışıyordu; ona hiç istek
 * ulaşmıyordu.
 *
 * Ölçüt iki kaynağı KARŞILAŞTIRIYOR: ön yüzün gönderdiği anahtarlar ile
 * denetleyicinin okuduğu anahtarlar. İkisi tek bir yerde tanımlı olmadığı için
 * ayrışmaları sessiz — ve bu sessizlik hatanın kendisiydi.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (p) => readFileSync(path.join(uygulamaKok, p), 'utf8');

/** Yorumsuz kaynak — açıklamalar parametre adlarını METİN olarak taşıyor. */
function yorumsuz(metin) {
  return metin
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .join('\n');
}

/** `ClinicController::index` içinde okunan istek alanları. */
function klinikUcununTanidiklari() {
  const kaynak = yorumsuz(oku('backend/app/Http/Controllers/Api/ClinicController.php'));
  const govde = kaynak.slice(kaynak.indexOf('public function index'), kaynak.indexOf('return response()->json($clinics)'));

  const adlar = new Set(['per_page', 'page']);

  for (const m of govde.matchAll(/\$request->([a-z_]+)/g)) adlar.add(m[1]);
  for (const m of govde.matchAll(/\$cityName/g)) adlar.add('city');

  return adlar;
}

/** Bir dosyadaki `clinicAPI.list({...})` çağrılarının anahtarları. */
function gonderilenler(dosyaYolu) {
  const kaynak = yorumsuz(oku(dosyaYolu));
  const anahtarlar = new Set();

  // Doğrudan nesne verilen çağrılar.
  for (const m of kaynak.matchAll(/clinicAPI\.list\(\{([^}]*)\}/g)) {
    for (const a of m[1].matchAll(/(\w+)\s*:/g)) anahtarlar.add(a[1]);
  }

  // `params` değişkeni üzerinden kurulanlar.
  if (/clinicAPI\.list\(params\)/.test(kaynak)) {
    for (const m of kaynak.matchAll(/params\.(\w+)\s*=/g)) anahtarlar.add(m[1]);
    const govde = kaynak.match(/const params = \{([^}]*)\}/);
    if (govde) for (const a of govde[1].matchAll(/(\w+)\s*:/g)) anahtarlar.add(a[1]);
  }

  return anahtarlar;
}

/**
 * Bilerek gönderilen, arka ucun görmezden geldiği parametreler.
 *
 * `country` için ülkeye göre süzme arka uçta YOK. Satır silinmedi çünkü niyeti
 * kaybetmek istemedik; ama sessiz kalmasın diye buraya ve `HomeV2` içine
 * yazıldı. Arka uç desteği geldiğinde bu liste boşalmalı.
 */
const BILINEN_BOSLUKLAR = new Map([
  ['src/screens/HomeV2.jsx', new Set(['country'])],
]);

test('klinik listesine gönderilen her süzgeci uç tanıyor', () => {
  const tanidik = klinikUcununTanidiklari();

  assert.ok(tanidik.has('name'), 'denetleyici okunamadı — ölçüt güncellenmeli');

  const uyusmayan = [];

  for (const dosya of [
    'src/screens/BrowseClinics.jsx',
    'src/screens/BrowseTreatments.jsx',
    'src/screens/HomeV2.jsx',
  ]) {
    const muaf = BILINEN_BOSLUKLAR.get(dosya) || new Set();

    for (const anahtar of gonderilenler(dosya)) {
      if (tanidik.has(anahtar) || muaf.has(anahtar)) continue;

      uyusmayan.push(`${dosya} → "${anahtar}"`);
    }
  }

  assert.deepEqual(
    uyusmayan,
    [],
    'Bu parametreleri `/api/clinics` tanımıyor; sessizce düşerler ve süzgeç\n'
      + 'hiç uygulanmadan tam liste döner. Uç şunları okuyor: '
      + [...klinikUcununTanidiklari()].sort().join(', '),
  );
});

test('arama kutusu ucun tanıdığı adı gönderiyor', () => {
  // Asıl hata buydu; adı doğrudan sabitliyoruz ki genel ölçüt bir gün
  // gevşerse bu yine yakalasın.
  const kaynak = yorumsuz(oku('src/screens/BrowseClinics.jsx'));

  assert.match(kaynak, /clinicAPI\.list\(\{[^}]*name: search/, 'arama kutusu `name` göndermiyor');
  assert.doesNotMatch(kaynak, /clinicAPI\.list\(\{[^}]*search: search/, '`search` parametresi geri gelmiş: uç onu tanımıyor');
});
