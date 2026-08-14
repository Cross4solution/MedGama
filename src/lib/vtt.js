/**
 * WebVTT okuma/yazma.
 *
 * Sunucu alt yazıyı WebVTT olarak veriyor (oynatıcıların doğrudan okuduğu
 * biçim), düzeltme ekranı ise satır listesiyle çalışıyor. Aradaki çeviri
 * burada; iki yerde ayrı ayrı yazılmasın diye tek dosyada.
 */

/** "00:01:02.500" → 62.5 */
export function zamaniSaniyeyeCevir(metin) {
  const parca = String(metin).trim().split(':');
  if (parca.length < 2) return 0;
  const saniye = parseFloat(parca.pop().replace(',', '.')) || 0;
  const dakika = parseInt(parca.pop(), 10) || 0;
  const saat = parca.length ? parseInt(parca.pop(), 10) || 0 : 0;
  return saat * 3600 + dakika * 60 + saniye;
}

/** 62.5 → "00:01:02.500" */
export function saniyeyiZamanaCevir(saniye) {
  const s = Math.max(0, Number(saniye) || 0);
  const saat = Math.floor(s / 3600);
  const dakika = Math.floor((s % 3600) / 60);
  const kalan = s % 60;
  const iki = (n) => String(n).padStart(2, '0');
  return `${iki(saat)}:${iki(dakika)}:${kalan.toFixed(3).padStart(6, '0')}`;
}

/**
 * WebVTT metnini satırlara ayırır: [{ start, end, text }]
 * Başlıklar, NOTE blokları ve numaralandırma satırları atlanır.
 */
export function vttCozumle(vtt) {
  const satirlar = String(vtt || '').replace(/\r/g, '').split('\n');
  const sonuc = [];
  let aktif = null;

  for (const ham of satirlar) {
    const satir = ham.trim();

    if (satir.startsWith('WEBVTT') || satir.startsWith('NOTE')) {
      aktif = null;
      continue;
    }

    if (satir.includes('-->')) {
      const [bas, bit] = satir.split('-->');
      aktif = {
        start: zamaniSaniyeyeCevir(bas),
        // Bitişte konum ayarları olabiliyor ("00:02.000 line:90%"); ilk parça yeter.
        end: zamaniSaniyeyeCevir(String(bit).trim().split(/\s+/)[0]),
        text: '',
      };
      sonuc.push(aktif);
      continue;
    }

    if (!satir) {
      aktif = null;
      continue;
    }

    if (aktif) {
      aktif.text = aktif.text ? `${aktif.text}\n${satir}` : satir;
    }
    // aktif yoksa satır bir sıra numarasıdır; yok say.
  }

  return sonuc.filter((s) => s.text.trim() !== '');
}

/** Satır listesinden WebVTT üretir. */
export function vttUret(parcalar) {
  const govde = (parcalar || [])
    .map((p) => `${saniyeyiZamanaCevir(p.start)} --> ${saniyeyiZamanaCevir(p.end)}\n${p.text}`)
    .join('\n\n');
  return `WEBVTT\n\n${govde}\n`;
}
