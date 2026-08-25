import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Başarısız bir istek "kaydınız yok" diye görünmemeli.
 *
 * Kalıp şu: `catch` bloğu listeyi boşaltıyor, boş liste de ekranda bir "henüz
 * bir şey yok" mesajına dönüşüyor. Sunucu ulaşılamazken kullanıcıya, aradığı
 * şeyin VAR OLMADIĞI söyleniyor.
 *
 * Ölçüldü: uygulamada 23 yerde bu kalıp var. Üçü düzeltildi ve üçü de
 * kullanıcıya yanlış bir şey söylüyordu:
 *
 *   • doktor araması — "Kriterlerinize uygun doktor bulunamadı, filtrelerinizi
 *     değiştirin". Yüzlerce uygun doktor olabilir; kişi filtrelerle uğraşıp
 *     doktorunun platformda olmadığına kanaat getiriyordu.
 *   • tıbbi arşiv — "Henüz belge yok, ilk belgenizi yükleyin". Kayıtları duran
 *     hastaya kasasının boş olduğu söyleniyordu.
 *   • hekim randevuları — "Randevu bulunmuyor". Dolu bir gün boş görünüyordu.
 *
 * ── Oturum açılabildikten sonra ölçülenler ──
 *
 * Demo oturumlarıyla CRM ekranları API tümüyle 500 dönerken gezildi. On ekran
 * "kayıt yok" diyordu. İkisi düzeltildi ve listeden çıkarıldı:
 *
 *   • hastalar    — "Sonuç bulunamadı". Bir kliniğe hastasının olmadığını
 *                   söylemek, kayıtların silindiğini düşündürür.
 *   • faturalama  — "Sonuç yok" + "ilk faturanızı oluşturun", faturaları duran
 *                   bir kliniğe.
 *   • personel    — yalnız BİLDİRİM gösteriyordu; bildirim geçici, ekran
 *                   kalıcı: liste "personel yok" demeye devam ediyordu.
 *   • değerlendirmeler — tümüyle sessiz `catch`; hekime hiç yorum almamış gibi
 *                   gösteriyordu.
 *   • gelen kutusu — "mesaj yok"; hasta mesajlarının cevapsız kalmasına yol
 *                   açar.
 *   • gelir       — en kötüsü. Dört çağrının her biri ayrı ayrı sessizce boşa
 *                   düşüyor ve ekran SIFIR GELİR gösteriyordu. Boş liste değil,
 *                   yanlış rakam. Artık başarısızlık sayılıyor ve sıfır yerine
 *                   hiçbir şey gösterilmiyor.
 *
 *   • CRM panosu  — kutular zaten "—" gösteriyordu (doğru), ama yanındaki
 *                   yapay zekâ şeridi "Bugün randevunuz yok, takviminiz boş"
 *                   diye HÜKÜM veriyor, başlık da "0 randevu" yazıyordu. Aynı
 *                   dosya "yüksek riskli hasta" ve "gelir trendi" çıkarımlarını
 *                   dayanacak veri olmadığı için zaten kaldırmıştı; bu ikisi
 *                   gözden kaçmıştı. Boş liste ile BİLİNMEYEN liste aynı değil.
 *
 * Kalanlar hâlâ listede: /crm/leads (kanban sütunları "0/Boş" diyor) ve
 * /crm/reports ("Henüz randevu verisi yok"). `/crm/examination` taramada
 * işaretlenmişti ama YANLIŞ POZİTİF çıktı: o ekran bir form, liste değil —
 * eşleşen metin form etiketleriydi.
 *
 * Geri kalanlar bilerek listede: bir kısmı zararsız (öneri açılır listesi boş
 * kalabilir), bir kısmı giriş arkasında ve ekranına bakılmadan düzeltilmemeli.
 * Liste BÜYÜMEMELİ — yeni bir sessiz yutma eklendiğinde bu test düşer.
 */

const buDosya = fileURLToPath(import.meta.url);
const kaynakKok = path.resolve(path.dirname(buDosya), '../..');

/**
 * Bilinen ve kabul edilmiş yerler.
 *
 * Buraya bir dosya eklemek "bu ekranda başarısızlık, boşluk gibi görünüyor"
 * demeyi kabul etmektir. Düzeltilen dosyalar listeden ÇIKARILMALI.
 *
 * ── Listeyi budarken dikkat ──
 *
 * "Dosyada `setError` VAR, demek ki ayırıyor" diye bakmak YANILTIYOR. Denendi:
 * on dosya öyle göründü, üçü elle okununca yanlış çıktı. `ClinicTeam` liste
 * çekiminde `.catch(() => {})` kullanıyor; oradaki `error` durumu FORM hatası
 * için. `DoctorBilling` ve `AdminCatalog` da aynı: hata durumu var ama başka
 * bir işin hatası.
 *
 * Bu yüzden aşağıdan yalnızca ekranı OKUNARAK doğrulanan kayıtlar çıkarıldı:
 * boş durumun gerçekten `!error` / `!hata` arkasında olduğu görülenler.
 * `screens/profile/MedstreamProfileFeed.jsx` ise artık var olmayan bir dosyaya
 * işaret ediyordu — muafiyet listesinde ölü kayıt, muafiyetten beterdir:
 * denetlenmediğini gizlerken denetleniyormuş gibi durur.
 */
const BILINEN = new Set([
  // Öneri/tamamlama listeleri: boş kalması makul, ekranı kaplamıyor.
  'components/forms/AccreditationsDropdown.jsx',
  'components/map/MapboxSearchInput.jsx',
  'components/forms/GlobalSuggest.jsx',

  // Giriş arkasındaki listeler — ekranına bakılmadan düzeltilmemeli.
  'screens/DoctorChatPage.jsx',
  'screens/admin/AdminAuditLogs.jsx',
  'screens/crm/CRMExamination.jsx',
  'screens/crm/CRMMessages.jsx',
  'components/profile/MedstreamProfileFeed.jsx',
  'screens/DoctorBilling.jsx',
  'screens/SavedClinics.jsx',
  'screens/SavedPosts.jsx',
  'screens/ClinicTeam.jsx',
  'screens/ClinicProfileEdit.jsx',
  'screens/DoctorsDepartments.jsx',
  'screens/TelehealthPage.jsx',
  'screens/crm/CRMLeads.jsx',
  'screens/crm/CRMDocuments.jsx',
  'screens/admin/AdminUserManagement.jsx',
  'screens/admin/AdminModeration.jsx',
  'screens/admin/AdminReviews.jsx',
  'screens/admin/AdminVerification.jsx',
  'screens/admin/AdminAnnouncements.jsx',
  'screens/admin/AdminCatalog.jsx',
  'screens/admin/AdminSupport.jsx',
  'screens/crm/CRMReports.jsx',
  'screens/crm/CRMSettings.jsx',
]);

function dosyalar(dizin = kaynakKok, toplam = []) {
  for (const girdi of readdirSync(dizin, { withFileTypes: true })) {
    if (girdi.name === '__tests__') continue;
    const tam = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) dosyalar(tam, toplam);
    else if (/\.jsx?$/.test(girdi.name)) toplam.push(tam);
  }
  return toplam;
}

/** `catch` gövdesinde boş listeye düşüp hatayı hiç işaretlemeyen yerler. */
function sessizYutanlar() {
  const bulunan = new Set();

  for (const yol of dosyalar()) {
    const metin = readFileSync(yol, 'utf8');

    for (const eslesme of metin.matchAll(/catch\s*(?:\([^)]*\))?\s*\{([^{}]{0,220})\}/g)) {
      const govde = eslesme[1];

      if (!/set\w+\(\s*\[\s*\]\s*\)/.test(govde)) continue;
      // Hatayı bir biçimde bildiriyorsa sessiz değil.
      if (/setError|notify\(|Hatasi|throw|toast/i.test(govde)) continue;

      bulunan.add(path.relative(kaynakKok, yol));
    }
  }

  return bulunan;
}

test('düzeltilen üç ekran hatayı boşlukla karıştırmıyor', () => {
  // Bu üçü ölçülerek düzeltildi; geri dönerlerse kullanıcıya yine yanlış şey
  // söylenir.
  const sessiz = sessizYutanlar();

  for (const yol of ['screens/SearchResults.jsx', 'screens/MedicalArchive.jsx', 'screens/DoctorAppointments.jsx']) {
    assert.ok(!sessiz.has(yol), `${yol} yine hatayı sessizce boş listeye çeviriyor`);
  }
});

test('yeni sessiz yutma eklenmemiş', () => {
  const yeni = [...sessizYutanlar()].filter((y) => !BILINEN.has(y)).sort();

  assert.deepEqual(
    yeni,
    [],
    'Başarısız istek sessizce boş listeye dönüyor. Kullanıcı, aradığı şeyin var\n'
      + 'olmadığını sanır. Hatayı ayrı bir durumda gösterin (örnek:\n'
      + '`SearchResults.jsx` içindeki `baglantiHatasi`) ya da bilinçliyse\n'
      + 'gerekçesiyle BILINEN listesine ekleyin:\n  ' + yeni.join('\n  '),
  );
});

test('düzeltilen ekranların hepsi yeniden deneme sunuyor', () => {
  // Hata ekranı çıkmaz sokak olmamalı.
  for (const [yol, islev] of [
    ['screens/SearchResults.jsx', 'fetch'],
    ['screens/MedicalArchive.jsx', 'fetchDocuments'],
    ['screens/DoctorAppointments.jsx', 'fetchAppointments'],
  ]) {
    const metin = readFileSync(path.join(kaynakKok, yol), 'utf8');

    assert.match(metin, new RegExp(`onClick=\\{${islev}\\}`), `${yol} — yeniden deneme isteği tekrarlamıyor`);
    assert.match(metin, /t\('common\.retry'\)/, `${yol} — yeniden deneme metni çeviriden gelmiyor`);
  }
});

test('ortak hata metinleri dokuz dilde de var', () => {
  for (const dil of ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'it', 'az']) {
    const sozluk = JSON.parse(readFileSync(path.join(kaynakKok, `i18n/locales/${dil}.json`), 'utf8'));

    assert.ok(sozluk.common?.loadFailedTitle, `${dil}.json — common.loadFailedTitle yok`);
    assert.ok(sozluk.common?.loadFailedHint, `${dil}.json — common.loadFailedHint yok`);
  }
});
