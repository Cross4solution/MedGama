import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * "REC" rozeti, transkript gerçekten çalışmadan görünmemeli.
 *
 * Görüşme ekranı, "Görüşmeyi başlat"a basılınca transkript panelini açıp
 * yanıp sönen kırmızı bir "REC" rozeti gösteriyordu. Panele akan cümleler ise
 * arka uçtaki sabit bir listeden rastgele seçiliyordu:
 *
 *   "Blood pressure is currently 130 over 85 millimeters of mercury."
 *   "Let me prescribe a low-dose aspirin and a beta blocker."
 *
 * Yanlarında uydurma %85–99 güven skoru ve saat damgası vardı. Arka uç yanıtta
 * `mode: "simulation"` diyordu, ön yüz bu alanı hiç okumuyordu.
 *
 * İki ayrı zarar vardı. Hekim, hastanın söylemediği bir tansiyon değerini ya
 * da yazılmamış bir ilacı görüşme kaydı sanabilirdi. Ve hastaya görüşmenin
 * kaydedildiği söylenmiş oluyordu — kayıt diye bir şey yokken verilmiş bir
 * rıza beyanı.
 *
 * Uç artık üretimde 404 (TelesaglikTranskriptiTest). Bu ölçüt ön yüzün buna
 * dürüst davrandığını tutuyor: rozet yalnız gerçek veri geldikten sonra
 * çıkar, uç kapalıyken panel bunu söyler.
 */

const buDosya = fileURLToPath(import.meta.url);
const kok = path.resolve(path.dirname(buDosya), '../../..');

const oku = (goreli) => readFileSync(path.join(kok, goreli), 'utf8');

const yorumsuz = (kaynak) =>
  kaynak.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('REC rozeti transkript çalıştığı doğrulanmadan çıkmıyor', () => {
  const ekran = yorumsuz(oku('src/screens/crm/CRMTelehealth.jsx'));

  const rozet = ekran.match(/\{[^{}]*isTranscribing[^{}]*&&[^{}]*\(/);
  assert.ok(rozet, 'REC rozetinin koşulu bulunamadı');
  assert.match(
    rozet[0],
    /transcriptionAvailable === true/,
    'REC rozeti yalnız isTranscribing\'e bakıyor — uç kapalıyken de kayıt ' +
      'alındığını söyler',
  );
});

test('uç kapalıyken panel transkriptin olmadığını söylüyor', () => {
  const ekran = yorumsuz(oku('src/screens/crm/CRMTelehealth.jsx'));

  assert.match(
    ekran,
    /transcriptionAvailable === false[\s\S]{0,200}transcriptUnavailable/,
    'boş panel hâlâ "oturum başlayınca görünecek" diyor; oysa görünmeyecek',
  );
});

test('yoklama başarısız olunca kanca durup durumu işaretliyor', () => {
  const kanca = yorumsuz(oku('src/hooks/useTelehealth.js'));

  const yakala = kanca.match(/catch\s*\{[\s\S]*?\n    \};/);
  assert.ok(yakala, 'yoklamanın catch bloğu bulunamadı');

  assert.match(
    yakala[0],
    /setTranscriptionAvailable\(false\)/,
    'uç 404 verdiğinde durum işaretlenmiyor',
  );
  assert.match(
    yakala[0],
    /clearInterval/,
    'uç kapalıyken yoklama üç saniyede bir 404 istemeye devam ediyor',
  );
});

test('başarı yolu, veri gelmeden transkripti çalışır saymıyor', () => {
  const kanca = yorumsuz(oku('src/hooks/useTelehealth.js'));

  // İşaret `results.length` kontrolünün İÇİNDE olmalı. Dışına çıkarsa boş
  // yanıt da rozeti yakar.
  assert.match(
    kanca,
    /if\s*\(data\?\.results\?\.length\)\s*\{\s*setTranscriptionAvailable\(true\)/,
    'transcriptionAvailable, sonuç gelmeden true yapılıyor',
  );
});
