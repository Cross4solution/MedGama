// Dışa aktarma kütüphanelerinin ŞEKLİ, `exportUtils.js` ne varsayıyorsa o
// olmalı.
//
// jsPDF ve XLSX statik olarak içeri alınıyordu ve onları çağıran iki CRM
// sayfası, kullanıcı "Dışa Aktar"a hiç basmasa bile bu ağırlığı indiriyordu
// (ölçüldü: /crm/reports 571 KB, /crm/revenue 566 KB). İçe aktarma işlevin
// içine alındı; sayfalar 204 KB'a indi.
//
// Ama dinamik içe aktarma, statik olanla AYNI ŞEYİ VERMİYOR ve bu iki kez
// sessizce kırdı:
//
//   1. `jspdf` paketinin varsayılan dışa aktarımı kurucu değil, bir nesne.
//      `const { default: jsPDF }` yazımı "jsPDF is not a constructor" veriyor.
//      Doğrusu adlandırılmış dışa aktarma: `const { jsPDF }`.
//
//   2. `jspdf-autotable` yalnızca içe aktarılınca prototipi yamalamıyor;
//      `doc.autoTable` tanımsız kalıyor. `applyPlugin` açıkça çağrılmalı.
//
// İkisi de sayfayı açarken değil, kullanıcı dışa aktarmaya BASINCA patlıyor
// — yani ekran taraması bunu yakalamaz. Bu yüzden ölçüt burada.
import test from 'node:test';
import assert from 'node:assert/strict';

test('jspdf adlandırılmış dışa aktarması bir kurucu', async () => {
  const modul = await import('jspdf');

  assert.equal(
    typeof modul.jsPDF, 'function',
    'jspdf artık `jsPDF` adlı bir kurucu vermiyor — exportUtils.js kırılır.',
  );

  // Varsayılan dışa aktarımın kurucu OLMADIĞINI da sabitliyoruz: ileride
  // biri "daha kısa" diye `default`a dönerse ölçüt uyarsın.
  assert.notEqual(
    typeof modul.default, 'function',
    'jspdf varsayılan dışa aktarımı artık kurucu; yorumlar ve kod gözden geçirilmeli.',
  );
});

test('jspdf-autotable prototipi ancak applyPlugin ile yamalıyor', async () => {
  const { jsPDF } = await import('jspdf');
  const otoTablo = await import('jspdf-autotable');

  assert.equal(
    typeof otoTablo.applyPlugin, 'function',
    '`applyPlugin` yok — autoTable eklentisinin bağlanma yolu değişmiş.',
  );

  otoTablo.applyPlugin(jsPDF);
  const belge = new jsPDF('p', 'mm', 'a4');

  assert.equal(typeof belge.autoTable, 'function', 'autoTable belgeye eklenmedi.');
});

test('üretilen PDF gerçekten içerik taşıyor', async () => {
  // Modüller yüklendi diye yetinmiyoruz: asıl soru dosyanın çıkıp çıkmadığı.
  const { jsPDF } = await import('jspdf');
  const otoTablo = await import('jspdf-autotable');
  otoTablo.applyPlugin(jsPDF);

  const belge = new jsPDF('p', 'mm', 'a4');
  belge.text('Deneme', 14, 20);
  belge.autoTable({ head: [['Sütun A', 'Sütun B']], body: [['1', '2'], ['3', '4']] });

  assert.ok(belge.lastAutoTable, 'lastAutoTable yok — exportUtils sonraki tablonun yerini hesaplayamaz.');
  assert.ok(
    belge.output('arraybuffer').byteLength > 500,
    'PDF çıktısı boş görünüyor.',
  );
});

test('xlsx çalışma kitabı üretebiliyor', async () => {
  const XLSX = await import('xlsx');

  assert.equal(typeof XLSX.utils?.book_new, 'function', 'XLSX.utils.book_new yok.');
  assert.equal(typeof XLSX.utils?.aoa_to_sheet, 'function', 'XLSX.utils.aoa_to_sheet yok.');
  assert.equal(typeof XLSX.writeFile, 'function', 'XLSX.writeFile yok.');

  const kitap = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(kitap, XLSX.utils.aoa_to_sheet([['a', 'b'], [1, 2]]), 'Sayfa');
  assert.deepEqual(kitap.SheetNames, ['Sayfa']);
});

test('exportUtils üst düzeyde ağır kütüphane içeri almıyor', async () => {
  // Asıl kazanç buydu; statik içe aktarma geri gelirse sayfalar yine
  // 571 KB'a çıkar ve kimse fark etmez.
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, resolve } = await import('node:path');

  const kok = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const kaynak = readFileSync(resolve(kok, 'src/utils/exportUtils.js'), 'utf8');

  const ustDuzey = kaynak
    .split('\n')
    .filter((satir) => /^import\s/.test(satir))
    .filter((satir) => /jspdf|xlsx/i.test(satir));

  assert.deepEqual(
    ustDuzey, [],
    'Ağır kütüphaneler yeniden üst düzeyde içeri alınmış:\n  ' + ustDuzey.join('\n  ')
    + '\n\nBu, /crm/reports ve /crm/revenue sayfalarını tekrar ~570 KB yapar. '
    + 'İçe aktarma işlevin içinde kalmalı.',
  );
});
