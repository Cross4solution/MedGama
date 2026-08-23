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

  return sonuc
    .filter((s) => s.text.trim() !== '')
    .map((s) => ({ ...s, text: metniCoz(s.text) }));
}

/**
 * Alt yazı metnini WebVTT gövdesine yazılabilir hâle getirir.
 *
 * `-->` zaman satırının AYRACI. Metnin içinde geçerse dosya yeniden
 * okunduğunda o satır zaman satırı sanılıyor ve cümle KAYBOLUYOR. Ölçüldü:
 * "Ağrı sırttan --> bacağa yayılıyor" içeren bir alt yazı, bir gidiş-dönüşten
 * sonra hiç kalmıyordu — 1 satır yerine 0.
 *
 * Hekimin ok işareti kullanması olağan bir şey; kayıp sessiz.
 *
 * WebVTT `&gt;` kaçışını tanıyor, o yüzden ok işareti kaçırılıyor. `&`
 * önce kaçırılıyor ki çözme işlemi tersine çevrilebilsin.
 */
function metniKacir(metin) {
  return String(metin ?? '')
    .replace(/&/g, '&amp;')
    .replace(/-->/g, '--&gt;');
}

/** `metniKacir` işleminin tersi. */
function metniCoz(metin) {
  return String(metin ?? '')
    .replace(/--&gt;/g, '-->')
    .replace(/&amp;/g, '&');
}

/** Satır listesinden WebVTT üretir. */
export function vttUret(parcalar) {
  const govde = (parcalar || [])
    .map((p) => `${saniyeyiZamanaCevir(p.start)} --> ${saniyeyiZamanaCevir(p.end)}\n${metniKacir(p.text)}`)
    .join('\n\n');
  return `WEBVTT\n\n${govde}\n`;
}
