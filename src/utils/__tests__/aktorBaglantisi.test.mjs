import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Akış kartındaki yazar bağlantısı doğru sayfaya gitmeli.
 *
 * `TimelineCard` yazar bağlantısını şöyle kuruyor:
 *
 *     if (actorHandle) return `/@${actorHandle}`;        // doğru sayfa
 *     if (rol === 'doctor') return `/doctor/${actorId}`;
 *     if (klinik)          return `/clinic/${actorId}`;  // ← 404
 *
 * Klinik rotası KİMLİK değil `codename` alıyor. Ölçüldü:
 *
 *     /tr/clinic/01a01f94-8f93-…   404
 *     /tr/clinic/anadolu-tup-bebek 200
 *     /tr/@anadolu-tup-bebek       200
 *
 * Kart hep dolgu adını tercih ediyor, yani sorun kartta değildi. API `author`
 * alanını `username` ile birlikte döndürüyor ve veride eksiği yok — ama API
 * yanıtını kartın beklediği `actor` biçimine çeviren kod YEDİ AYRI YERDE
 * kopyalanmış ve bunların BEŞİ `username` alanını taşımıyordu. O beş yüzeyde
 * dolgu adı hiç görünmüyor, dolayısıyla kart kimliğe düşüyordu.
 *
 * Biri ana sayfaydı: oturum açmamış bir ziyaretçi akış önizlemesinde bir
 * kliniğin adına tıkladığında 404 alıyordu. Ölçülen hâli — düzeltmeden önce
 * ana sayfada 3 klinik bağlantısı, üçü de kimlikli; sonra sıfır, hepsi
 * `/@dolgu-adı`.
 *
 * Kopyalanmış biçim asıl kusur. Bu ölçüt kopyaların ayrışmasını yakalıyor:
 * sekizinci bir yer eklendiğinde `username`i unutmak yine sessiz olurdu.
 */

const buDosya = fileURLToPath(import.meta.url);
const uygulamaKok = path.resolve(path.dirname(buDosya), '../../..');

/** `src/` altındaki tüm kaynak dosyalar. */
function kaynaklar(dizin, toplam = []) {
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    if (g.name === '__tests__' || g.name === 'node_modules') continue;

    const tam = path.join(dizin, g.name);
    if (g.isDirectory()) kaynaklar(tam, toplam);
    else if (/\.jsx?$/.test(g.name)) toplam.push(tam);
  }

  return toplam;
}

/** Bir dosyadaki `actor: {` bloklarının gövdesi. */
function aktorBloklari(metin) {
  const bloklar = [];
  const satirlar = metin.split('\n');

  for (let i = 0; i < satirlar.length; i++) {
    if (!satirlar[i].trim().startsWith('actor: {')) continue;

    // Kapanışa kadar oku (bloklar sığ, iç içe nesne yok).
    const govde = [];
    for (let j = i + 1; j < satirlar.length && j < i + 15; j++) {
      if (satirlar[j].trim().startsWith('}')) break;
      govde.push(satirlar[j]);
    }

    bloklar.push({ satir: i + 1, govde: govde.join('\n') });
  }

  return bloklar;
}

test('her aktör dönüşümü dolgu adını taşıyor', () => {
  const eksik = [];
  let toplam = 0;

  for (const dosya of kaynaklar(path.join(uygulamaKok, 'src'))) {
    for (const blok of aktorBloklari(readFileSync(dosya, 'utf8'))) {
      toplam += 1;
      if (/\busername\b/.test(blok.govde)) continue;

      eksik.push(`${path.relative(uygulamaKok, dosya)}:${blok.satir}`);
    }
  }

  assert.ok(toplam >= 5, `tarama çalışmıyor: ${toplam} blok bulundu`);

  assert.deepEqual(
    eksik,
    [],
    'Bu dönüşümler `username` taşımıyor. Kart dolgu adını göremeyince yazar\n'
      + 'bağlantısını kimlikle kuruyor ve klinikler için o adres 404 veriyor.',
  );
});

test('kart dolgu adını kimliğe tercih ediyor', () => {
  // Sıra önemli: kimlik denetimi öne alınırsa dolgu adı hiç kullanılmaz.
  const kart = readFileSync(path.join(uygulamaKok, 'src/components/timeline/TimelineCard.jsx'), 'utf8');

  const handle = kart.indexOf('if (actorHandle) return');
  const klinik = kart.indexOf("return `/clinic/${encodeURIComponent(actorId");

  assert.ok(handle > 0, 'dolgu adı yolu kaldırılmış');
  assert.ok(klinik > 0, 'klinik yolu kaldırılmış — bu ölçüt güncellenmeli');
  assert.ok(handle < klinik, 'kimlik yolu dolgu adının önüne geçmiş');
});

test('site haritası klinikleri kimlikle listelemiyor', () => {
  // `/clinic/<uuid>` 404 veriyor; site haritasında eksik kayıt, kırık kayıttan
  // iyidir.
  const harita = readFileSync(path.join(uygulamaKok, 'app/sitemap.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((s) => !s.trim().startsWith('//'))
    .join('\n');

  assert.doesNotMatch(
    harita,
    /\/clinic\/\$\{c\.codename \|\| c\.id\}/,
    'site haritası codename yoksa kimliğe düşüyor: arama motoruna 404 veren adres gider',
  );
  assert.match(harita, /\/clinic\/\$\{c\.codename\}/, 'klinik adresleri codename ile kurulmuyor');
});
