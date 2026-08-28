
// ── Brand colors ──
const TEAL = [10, 110, 111]; // #0A6E6F
const GRAY_HEADER = [249, 250, 251];
const GRAY_TEXT = [107, 114, 128];

/**
 * Excel sayfa adı olarak kabul edilebilir bir ada çevirir.
 *
 * Excel dört şeyi reddediyor ve SheetJS bunları sessizce düzeltmiyor, istisna
 * fırlatıyor: `: \ / ? * [ ]` karakterleri, 31 karakterden uzun adlar, aynı
 * çalışma kitabında yinelenen adlar, ve boş ad.
 *
 * Başlıklar çeviri dosyalarından geliyor. Yani "Gelir / Gider" gibi tek bir
 * çeviri, dışa aktarımın TAMAMINI düşürmeye yetiyor — üstelik sessizce:
 * çağıran ekranlar hatayı `catch` ile yakalayıp yalnız konsola yazıyor.
 * Kullanıcı düğmeye basıyor, hiçbir şey olmuyor, sebebini kimse görmüyor.
 *
 * @param {string} baslik
 * @param {Set<string>} kullanilanlar - aynı kitapta daha önce verilmiş adlar
 */
export function sayfaAdi(baslik, kullanilanlar = new Set()) {
  const temiz = String(baslik ?? '')
    .replace(/[:\\/?*[\]]/g, '-')
    .trim()
    .slice(0, 31)
    .trim();

  let ad = temiz || 'Sayfa';

  // Yinelenen ad da istisna fırlatıyor; sona sayı ekleyip 31 sınırında tut.
  if (kullanilanlar.has(ad)) {
    let n = 2;
    let aday;
    do {
      const ek = ` (${n})`;
      aday = ad.slice(0, 31 - ek.length) + ek;
      n += 1;
    } while (kullanilanlar.has(aday));
    ad = aday;
  }

  kullanilanlar.add(ad);
  return ad;
}

/**
 * Generate and download a PDF report
 * @param {Object} opts
 * @param {string} opts.title - Report title
 * @param {string} opts.subtitle - Report subtitle / date range
 * @param {Array<{label: string, value: string}>} opts.summary - KPI summary cards
 * @param {Array<{title: string, headers: string[], rows: string[][]}>} opts.tables - Data tables
 * @param {string} [opts.filename] - Download filename
 */
export const exportPDF = async ({ title, subtitle, summary = [], tables = [], filename }) => {
  // Kütüphane ancak burada iniyor; sayfa açılışında değil.
  //
  // ADLANDIRILMIŞ dışa aktarma kullanılıyor: `jspdf` paketinin varsayılan
  // dışa aktarımı kurucu DEĞİL, bir nesne. Statik `import jsPDF from 'jspdf'`
  // yazımında paketleyici bu farkı örtüyordu; dinamik içe aktarmada örtmüyor
  // ve `new jsPDF(...)` "is not a constructor" ile patlıyor. Ölçülerek
  // bulundu, tahmin edilmedi.
  const { jsPDF } = await import('jspdf');

  // `jspdf-autotable` prototipi kendiliğinden yamalamıyor (ölçüldü:
  // `doc.autoTable` tanımsız kalıyor). Paket `applyPlugin` sunuyor; onu
  // açıkça çağırıyoruz. Statik içe aktarmada yan etki olarak oluyordu,
  // dinamikte olmuyor.
  const otoTablo = await import('jspdf-autotable');
  if (typeof otoTablo.applyPlugin === 'function') otoTablo.applyPlugin(jsPDF);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // ── Header bar ──
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle || new Date().toLocaleDateString(), 14, 19);
  doc.setFontSize(8);
  doc.text(`Medagama CRM — Generated ${new Date().toLocaleString()}`, 14, 25);
  y = 35;

  // ── KPI Summary cards ──
  if (summary.length > 0) {
    const cardW = (pageW - 28 - (summary.length - 1) * 4) / Math.min(summary.length, 4);
    const rows = Math.ceil(summary.length / 4);
    for (let row = 0; row < rows; row++) {
      const rowItems = summary.slice(row * 4, (row + 1) * 4);
      rowItems.forEach((item, i) => {
        const x = 14 + i * (cardW + 4);
        doc.setFillColor(...GRAY_HEADER);
        doc.roundedRect(x, y, cardW, 18, 2, 2, 'F');
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), x + 4, y + 8);
        doc.setTextColor(...GRAY_TEXT);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, x + 4, y + 14);
      });
      y += 24;
    }
    y += 4;
  }

  // ── Data tables ──
  tables.forEach((table, idx) => {
    if (y > 260) { doc.addPage(); y = 15; }

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(table.title, 14, y);
    y += 6;

    doc.autoTable({
      startY: y,
      head: [table.headers],
      body: table.rows,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [55, 65, 81],
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: TEAL,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: () => {
        // Footer on each page
        const pageH = doc.internal.pageSize.getHeight();
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(7);
        doc.text(`Medagama CRM Report — Page ${doc.internal.getNumberOfPages()}`, 14, pageH - 8);
      },
    });

    y = doc.lastAutoTable.finalY + 12;
  });

  // ── Download ──
  const fname = filename || `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
};

/**
 * Generate and download an Excel file
 * @param {Object} opts
 * @param {string} opts.title - Sheet name / report title
 * @param {Array<{label: string, value: string}>} opts.summary - KPI summary row
 * @param {Array<{title: string, headers: string[], rows: (string|number)[][]}>} opts.tables - Data tables
 * @param {string} [opts.filename] - Download filename
 */
export const exportExcel = async ({ title, summary = [], tables = [], filename }) => {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // ── Summary sheet ──
  if (summary.length > 0) {
    const summaryData = [
      [title, '', `Generated: ${new Date().toLocaleString()}`],
      [],
      summary.map(s => s.label),
      summary.map(s => s.value),
      [],
    ];
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    // Set column widths
    ws['!cols'] = summary.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  }

  // ── Data tables as separate sheets ──
  const kullanilanAdlar = new Set(summary.length > 0 ? ['Summary'] : []);

  tables.forEach((table) => {
    const sheetData = [
      table.headers,
      ...table.rows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = table.headers.map((h) => ({ wch: Math.max(h.length + 5, 15) }));
    XLSX.utils.book_append_sheet(wb, ws, sayfaAdi(table.title, kullanilanAdlar));
  });

  // ── Download ──
  const fname = filename || `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
};
