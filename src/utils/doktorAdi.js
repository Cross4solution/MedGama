/**
 * Doktorun ekranda görünecek adı — unvanı iki kez yazmadan.
 *
 * Veride iki biçim bir arada: bazı kayıtlarda unvan `fullname` alanının İÇİNDE,
 * bazılarında ayrı `title` alanında. Arayüz ikisini koşulsuz birleştirince
 * unvan tekrarlanıyordu. Yerel veritabanında ölçüldü — on dört doktorun
 * dokuzunda `fullname` zaten unvanla başlıyor:
 *
 *     title "Doç. Dr."  + fullname "Doç. Dr. Nazlı Çetin"  → "Doç. Dr. Doç. Dr. Nazlı Çetin"
 *     title "Dt."       + fullname "Dt. Mert Doğan"        → "Dt. Dt. Mert Doğan"
 *     title "Fzt."      + fullname "Fzt. Burak Şahin"      → "Fzt. Fzt. Burak Şahin"
 *
 * Bir de örtüşen durum var: unvan "Doç. Dr.", ad "Dr. Selin Arslan". Düz
 * birleştirme "Doç. Dr. Dr. Selin Arslan" veriyor. Buradaki "Dr." addaki genel
 * hitap; unvan onu zaten kapsıyor.
 *
 * `title` her zaman akademik unvan DEĞİL — bazı kayıtlarda uzmanlık yazıyor
 * ("Kardiyoloji Uzmanı"). Bu yüzden addan bir hitap yalnızca unvan AYNI hitapla
 * bitiyorsa düşürülüyor: "Kardiyoloji Uzmanı" + "Dr. Alt Yazı" olduğu gibi
 * kalıyor, çünkü doğrusu o.
 */

/** Karşılaştırma için: baştaki/sondaki boşluklar ve iç boşluk farkları önemsiz. */
function sadelestir(metin) {
  return String(metin || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
}

export default function doktorAdi(unvan, ad) {
  const temizAd = String(ad || '').trim().replace(/\s+/g, ' ');
  const temizUnvan = String(unvan || '').trim().replace(/\s+/g, ' ');

  if (!temizUnvan) return temizAd;
  if (!temizAd) return temizUnvan;

  // 1) Ad zaten unvanla başlıyorsa unvan eklenmez.
  if (sadelestir(temizAd).startsWith(`${sadelestir(temizUnvan)} `)) return temizAd;

  // 2) Unvanın son sözcüğü, adın ilk sözcüğüyle aynıysa addaki tekrar düşer.
  //    ("Doç. Dr." + "Dr. Selin Arslan" → "Doç. Dr. Selin Arslan")
  const unvanSon = temizUnvan.split(' ').pop();
  const adParcalari = temizAd.split(' ');

  if (adParcalari.length > 1 && sadelestir(adParcalari[0]) === sadelestir(unvanSon)) {
    return `${temizUnvan} ${adParcalari.slice(1).join(' ')}`;
  }

  return `${temizUnvan} ${temizAd}`;
}
