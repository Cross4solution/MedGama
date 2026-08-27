// İngilizce çeviri dosyasında Türkçe metin kalmasın.
//
// Ölçüldüğünde 22 anahtar İngilizce yerine Türkçe taşıyordu: fatura durumları
// ("Ödendi", "Ödeme bekliyor"), CRM mesaj ve reçete ekranlarının boş durum
// metinleri, dosya yükleme hataları, kayıt akışının hata mesajı.
//
// Sessiz bir hata: Türkçe konuşan hiç kimse fark etmiyor, çünkü Türkçe arayüz
// doğru. Yalnız İngilizceye geçen kullanıcı görüyor — ve bu kişi genelde
// sağlık turizmi hastası, yani ödeme ekranını en çok okuması gereken kişi.
//
// Sınama Türkçeye özgü harfleri arıyor. Birkaç değer İngilizce metnin İÇİNDE
// meşru olarak Türkçe geçiyor (ülke adı, adres örneği, Türkçe arama terimi
// örnekleri); onlar aşağıda tek tek adlarıyla muaf tutuluyor — toptan bir
// kural değil, sayılı bir liste, ki yenisi eklendiğinde fark edilsin.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// İngilizce metnin içinde Türkçe geçmesi DOĞRU olan yerler.
const MUAF = new Set([
  'aboutPage.scopeDesc',              // "…doctors and clinics in Türkiye."
  'clinicOnboarding.addressHint',     // adres örneği: "Sağlık Cad. No: 12"
  'admin.catalog.aliasesHint',        // Türkçe eşanlam örneği gösteriyor
  'admin.catalog.aliasPlaceholderTr', // Türkçe eşanlam alanının örneği
]);

// ğ ş ı İ Ğ Ş yalnız Türkçede; ç ö ü â î başka dillerde de var ama
// İngilizce arayüz metninde hiçbirinin işi yok.
const TURKCE_HARF = /[ğşıİĞŞçÇöÖüÜâî]/;

const duzle = (o, onek = '') =>
  Object.entries(o ?? {}).reduce((biriken, [anahtar, deger]) => {
    const yol = onek ? `${onek}.${anahtar}` : anahtar;
    return Object.assign(
      biriken,
      deger && typeof deger === 'object' ? duzle(deger, yol) : { [yol]: deger },
    );
  }, {});

test('en.json içinde Türkçe metin kalmamış', () => {
  const en = duzle(JSON.parse(readFileSync(resolve(KOK, 'src/i18n/locales/en.json'), 'utf8')));

  const sizan = Object.entries(en)
    .filter(([yol, deger]) =>
      typeof deger === 'string' && TURKCE_HARF.test(deger) && !MUAF.has(yol))
    .map(([yol, deger]) => `  ${yol} = "${deger.slice(0, 60)}"`);

  assert.deepEqual(
    sizan,
    [],
    'İngilizce çeviride Türkçe metin var — İngilizce arayüzde olduğu gibi '
    + 'görünür:\n' + sizan.join('\n')
    + '\n\nİçinde Türkçe geçmesi gereken bir metinse (ülke adı, örnek) '
    + 'ingilizceSizintisi.test.mjs içindeki MUAF listesine ekleyin.',
  );
});

test('muafiyet listesi eskimemiş', () => {
  // Muaf bir anahtar sonradan tümüyle İngilizceye çevrilirse listede kalması
  // korumayı zayıflatır: ileride biri oraya Türkçe yazsa kimse fark etmez.
  const en = duzle(JSON.parse(readFileSync(resolve(KOK, 'src/i18n/locales/en.json'), 'utf8')));

  const gereksiz = [...MUAF].filter(
    (yol) => !(typeof en[yol] === 'string' && TURKCE_HARF.test(en[yol])));

  assert.deepEqual(
    gereksiz,
    [],
    'Bu anahtarlarda artık Türkçe harf yok; MUAF listesinden çıkarın:\n  '
    + gereksiz.join('\n  '),
  );
});
