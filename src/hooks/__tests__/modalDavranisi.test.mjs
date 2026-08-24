import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Modalların klavye davranışı tek yerden gelmeli.
 *
 * Ölçüldü: yüzeydeki 61 modalın 5'i Escape'i dinliyor, 3'ü odağı yönetiyordu.
 * Faresiz kullanıcı için modal bir kapan: odak arkadaki sayfada kalıyor, sekme
 * modalın ALTINDAKİ bağlantılarda dolaşıyor, kapatma düğmesine ulaşmak için
 * önce arkadaki onlarca öğeyi geçmek gerekiyor.
 *
 * `useModalDavranisi` dördünü birlikte yapıyor: Escape, odağın içeri girmesi,
 * sekmenin içeride dönmesi, kapanışta odağın AÇAN öğeye dönmesi. Gövde
 * kaydırma kilidi de aynı yaşam döngüsüne bağlı olduğu için orada.
 *
 * Kilidin orada olması bir kural doğuruyor ve testin asıl konusu o: kancayı
 * kullanan dosya kilidi AYRICA kurmamalı. İkisi birlikte çalışırken kilit hiç
 * açılmıyordu — alttaki etki `hidden`ı kuruyor, kanca eski değer diye `hidden`ı
 * saklıyor, kapanışta temizlikler tanımlanma sırasında çalışıp önce boşaltıyor,
 * sonra `hidden`a geri koyuyordu. Sonuç: modal kapanıyor ama sayfa bir daha
 * kaydırılamıyor. Hiçbir hata çıkmıyor, iki dosyada birden ölçüldü.
 */

const buDosya = fileURLToPath(import.meta.url);
const kaynakKok = path.resolve(path.dirname(buDosya), '../..');

/** Kancayı kullanan, ölçülmüş dosyalar. */
const KANCAYI_KULLANANLAR = [
  'components/common/Modal.jsx',
  'components/crm/CRMModal.jsx',
  'components/modals/BookAppointmentModal.jsx',
  'components/modals/DoctorBookingModal.jsx',
  'components/modals/OnlineConsultationModal.jsx',
  'components/modals/SendMessageModal.jsx',

  // İkinci parti: onay pencereleri, fiyat penceresi, doğrulama, galeri.
  //
  // `CookieInfoPopup` bilerek yok: hiçbir yerden çağrılmıyor (ölü bileşen),
  // onu korumak boş bir güvence olurdu.
  'components/auth/PrivacyPopup.jsx',
  'components/auth/TermsPopup.jsx',
  'components/crm/ProTeaser.jsx',
  'components/crm/ClinicVerificationModal.jsx',
  'components/clinic/modals/BeforeAfterModal.jsx',

  // Üçüncü parti: CRM ekranlarındaki satır içi pencereler.
  'screens/crm/CRMPatients.jsx',
  'screens/crm/CRMFaq.jsx',
  'screens/crm/CRMPrescriptions.jsx',
  'screens/crm/CRMDocuments.jsx',
  'screens/crm/CRMAppointments.jsx',
  'screens/crm/CRMBilling.jsx',
  'screens/crm/CRMClinicManager.jsx',
  'screens/crm/CRMSmartCalendar.jsx',
  'screens/crm/CRMTelehealth.jsx',
  'screens/crm/CRMExamination.jsx',
  'screens/crm/CRMMessages.jsx',

  // Dördüncü parti: hastanın kendi ekranları.
  'screens/PatientAppointments.jsx',
  'screens/PatientInvoices.jsx',
  'screens/PatientDashboard.jsx',
  'screens/Profile.jsx',
  'screens/SavedClinics.jsx',
  'screens/SavedPosts.jsx',
  'screens/DoctorProfile.jsx',
  'components/chat/ChatMessage.jsx',
  'components/clinic/modals/ImageGalleryModal.jsx',

  // Beşinci parti: yönetim ekranları.
  'screens/admin/AdminAnnouncements.jsx',
  'screens/admin/AdminCatalog.jsx',
  'screens/admin/AdminModeration.jsx',
  'screens/admin/AdminReviews.jsx',
  'screens/admin/AdminSupport.jsx',
  'screens/admin/AdminUserManagement.jsx',
  'screens/admin/AdminVerification.jsx',
  'screens/admin/AdminVerificationReview.jsx',

  // Altıncı parti: bölüm/doktor yönetimi ve tıbbi arşiv.
  'screens/DoctorsDepartments.jsx',
  'screens/MedicalArchive.jsx',

  // Yedinci parti: kalan hasta/klinik pencereleri, çıkış onayları ve çekmece.
  'components/SidebarPatient.jsx',
  'components/layout/Header.jsx',
  'components/timeline/PostCreateModal.jsx',
  'context/AuthContext.jsx',
  'screens/DataPrivacyRightsPage.jsx',
  'screens/ExploreTimeline.jsx',
  'screens/ClinicTeam.jsx',
  'screens/ClinicProfileEdit.jsx',
  'screens/DoctorBilling.jsx',
  'screens/crm/CRMLeads.jsx',
];

/**
 * Kilit kuralının dışında tutulanlar ve NEDENİ.
 *
 * `ProTeaser` iki bileşen taşıyor: kilidi olan, hep ekranda duran SAYFA
 * bileşeni ve içindeki fiyat penceresi. Sayfanın kilidi pencereye ait değil,
 * arkadaki kilitli görünümü ayakta tutuyor — kaldırıldığında kilitli sayfa
 * kaydırılabilir hâle geliyordu. Ölçüldü ve geri alındı.
 */
const KILIT_MUAFI = ['components/crm/ProTeaser.jsx'];

const oku = (goreli) => readFileSync(path.join(kaynakKok, goreli), 'utf8');

test('modallar klavye davranışını kancadan alıyor', () => {
  for (const yol of KANCAYI_KULLANANLAR) {
    const metin = oku(yol);

    assert.match(metin, /useModalDavranisi\(/, `${yol} kancayı çağırmıyor: Escape ve odak tuzağı kaybolur`);
    // Ref adı dosyadan dosyaya değişiyor (bir ekranda iki pencere olabiliyor),
    // o yüzden ada değil, kancanın döndürdüğü ref'in BAĞLANMIŞ olmasına bakılıyor.
    const refAdlari = [...metin.matchAll(/const (\w+) = useModalDavranisi\(/g)].map((m) => m[1]);

    assert.ok(refAdlari.length > 0, `${yol} kancanın dönüşünü bir değişkene almıyor`);

    for (const ad of refAdlari) {
      assert.ok(
        metin.includes(`ref={${ad}}`),
        `${yol}: ${ad} hiçbir öğeye bağlanmamış — odak tuzağı hiçbir şey bulamaz`,
      );
    }
  }
});

test('kancayı kullanan dosya kaydırma kilidini AYRICA kurmuyor', () => {
  // Bu testin sebebi yukarıda yazılı: iki kilit birlikte, kilidi hiç
  // açılmayan bir sayfa üretiyor.
  const kusurlu = KANCAYI_KULLANANLAR
    .filter((yol) => !KILIT_MUAFI.includes(yol))
    .filter((yol) => /body\.style\.overflow/.test(oku(yol)));

  assert.deepEqual(
    kusurlu,
    [],
    'Kanca kaydırma kilidini zaten kuruyor. İkinci bir kilit, kapanışta\n'
      + 'kilidin AÇILMAMASINA yol açar; sayfa bir daha kaydırılamaz:\n  '
      + kusurlu.join('\n  '),
  );
});

test('modallar ekran okuyucuya diyalog olduklarını söylüyor', () => {
  for (const yol of KANCAYI_KULLANANLAR) {
    const metin = oku(yol);

    assert.match(metin, /role="dialog"/, `${yol} role="dialog" taşımıyor`);
    assert.match(metin, /aria-modal="true"/, `${yol} aria-modal taşımıyor`);
  }
});

test('kanca kapatma işlevini etkiye bağlamıyor', () => {
  // `handleClose` çoğu çağrı yerinde her renderda yeniden kuruluyor. Etkiye
  // doğrudan bağlansaydı etki her renderda sökülüp yeniden kurulur, odak da
  // her seferinde ilk alana atlardı: kullanıcı forma yazarken imleç kaçardı.
  const kanca = oku('hooks/useModalDavranisi.js');

  assert.match(kanca, /kapatRef\.current = kapat/, 'kapatma işlevi ref\'e alınmıyor');
  assert.match(kanca, /\}, \[acik\]\);/, 'etki `kapat`a bağlı: her renderda odak ilk alana atlar');
});

test('kanca odağı açan öğeye geri veriyor', () => {
  // Dönmezse kullanıcı sayfanın başına savrulur ve kaldığı yeri kaybeder —
  // uzun bir klinik sayfasında bu, aşağı kaydırdığı her şeyi yeniden bulmak
  // demek.
  const kanca = oku('hooks/useModalDavranisi.js');

  assert.match(kanca, /oncekiOdakRef\.current = document\.activeElement/, 'açan öğe saklanmıyor');
  assert.match(kanca, /document\.contains\(onceki\)/, 'öğe hâlâ ekranda mı diye bakılmıyor');
});

test('açıklık propu olan bileşen sabit `true` geçmiyor', () => {
  // Kanca bileşenin gövdesinde duruyor, pencerenin JSX'inde değil. Bayrak sabit
  // `true` yazılırsa odak tuzağı pencere ekranda YOKKEN de kuruluyor: Escape
  // görünmeyen bir pencereyi kapatmaya çalışıyor, sekme hiçbir yere gitmiyor ve
  // gövde kaydırması kilitli kalıyor.
  //
  // Ölçüldü: dönüşümü betikle yaptığımda dokuz çağrının hepsi `true` gelmişti.
  // Linter bunu göremez — koşullu olan render, kanca değil.
  //
  // `true` her zaman yanlış DEĞİL: bileşenin kendisi koşullu render ediliyorsa
  // zaten yalnız pencere açıkken var oluyor. Ayıran işaret, bileşenin bir
  // `open`/`isOpen` propu ALIP ALMADIĞI: alıyorsa açıklığı o prop söyler ve
  // kanca onu okumak zorunda.
  const kusurlu = [];

  for (const yol of KANCAYI_KULLANANLAR) {
    const satirlar = oku(yol).split('\n');

    for (const [i, satir] of satirlar.entries()) {
      if (!/useModalDavranisi\(true,/.test(satir)) continue;

      // Kancayı taşıyan bileşenin imzası: yukarıdaki en yakın tanım.
      const imza = satirlar
        .slice(0, i)
        .reverse()
        .find((l) => /^(?:function \w+|const \w+ =|export default function \w+)/.test(l)) || '';

      if (/\b(open|isOpen)\b/.test(imza)) {
        kusurlu.push(`${yol}  ${imza.trim().slice(0, 60)}`);
      }
    }
  }

  assert.deepEqual(
    kusurlu,
    [],
    'Bileşen açıklığı bir proptan öğreniyor ama kanca sabit `true` alıyor.\n'
      + 'Pencere kapalıyken de odak tuzağı kurulur ve sayfa kilitli kalır:\n  '
      + kusurlu.join('\n  '),
  );
});
