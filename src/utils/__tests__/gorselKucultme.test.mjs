import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Yüklemeden önce görselleri küçültme — neye DOKUNMAMASI gerektiği.
 *
 * `resizeImage` her dosyayı tuvale çizip yeniden kodluyor. Bu iyi bir fikir
 * ama yanlış dosyaya uygulanırsa sessizce zarar veriyor:
 *
 *   • Görsel olmayan bir dosya (PDF, rapor) tuvale çizilemez; JPEG'e
 *     dönüştürülmeye çalışılırsa içerik bozulur.
 *   • Hareketli GIF tuvalde tek kareye iner: hasta bir animasyon yükler,
 *     karşı taraf donmuş bir resim görür.
 *   • Zaten küçük bir dosyayı yeniden kodlamak boşuna kayıp: JPEG kayıplı,
 *     her tur biraz daha bozuyor ve kazanç yok.
 *
 * Üç kapının üçü de erken `return` ile çalışıyor, yani tuvale hiç
 * dokunmuyorlar — bu yüzden tarayıcı olmadan da sınanabiliyorlar. Kapılardan
 * biri kalkarsa test düşer; kalkması sessiz bir bozulma olurdu.
 */

const { resizeImage, resizeImages } = await import('../imageResize.js');

/** Belirli tür ve boyutta sahte bir dosya. */
function dosya(ad, tur, boyut) {
  return {
    name: ad,
    type: tur,
    size: boyut,
    // `resizeImage` bunlara yalnız küçültme yoluna girerse dokunuyor.
  };
}

const KB = 1024;
const MB = 1024 * KB;

test('görsel olmayan dosya olduğu gibi geçiyor', async () => {
  // Tıbbi arşive yüklenen PDF raporlar bu yoldan geçiyor.
  const pdf = dosya('tahlil.pdf', 'application/pdf', 4 * MB);

  assert.equal(await resizeImage(pdf), pdf);
});

test('hareketli GIF olduğu gibi geçiyor', async () => {
  // Tuval tek kare çizer; küçültme animasyonu öldürür.
  const gif = dosya('egzersiz.gif', 'image/gif', 3 * MB);

  assert.equal(await resizeImage(gif), gif);
});

test('küçük görsel yeniden kodlanmıyor', async () => {
  // JPEG kayıplı: kazanç getirmeyen her tur görüntüyü biraz daha bozuyor.
  const kucuk = dosya('recete.jpg', 'image/jpeg', 200 * KB);

  assert.equal(await resizeImage(kucuk), kucuk);
});

test('sınırın hemen altındaki dosya da dokunulmadan geçiyor', async () => {
  // Sınır 500 KB. Kapının `<` mi `<=` mi olduğu değil, sınırın var olduğu
  // korunuyor: tek bir baytlık dosya için tuval açmak anlamsız.
  const sinirAlti = dosya('kucuk.png', 'image/png', 499 * KB);

  assert.equal(await resizeImage(sinirAlti), sinirAlti);
});

test('çoklu küçültme her dosyayı ayrı ayrı ele alıyor', async () => {
  // Sıra korunmalı: ekran dönen listeyi seçilen dosyalarla eşleştiriyor.
  const girdiler = [
    dosya('a.pdf', 'application/pdf', 2 * MB),
    dosya('b.gif', 'image/gif', 2 * MB),
    dosya('c.jpg', 'image/jpeg', 100 * KB),
  ];

  const cikti = await resizeImages(girdiler);

  assert.equal(cikti.length, 3);
  assert.deepEqual(cikti, girdiler, 'sıra ya da içerik değişmiş');
});

test('boş liste çökmüyor', async () => {
  assert.deepEqual(await resizeImages([]), []);
});
