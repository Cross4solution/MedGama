# Medagama — Proje Teslim Tutanağı

Sözleşme: Yazılım Geliştirme ve Hizmet Sözleşmesi (imza 25.08.2025) ve Ek-1

Tarih: ___ / ___ / 2026

## Kısaca

Sözleşmede yazılı 18 modülün **15'i tamamen bitti ve yayında**. Kalan üçü
(ücretli profesyonel inceleme, sağlık turizmi paketi, online ödeme) bizim
tarafımızda hazır; tamamlanmaları yalnız Müşteri'nin sağlayacağı hesap,
onay ve lisanslara bağlı. Bu girdiler ne oldukları, ne için gerektikleri ve
daha önce ne zaman istendikleriyle birlikte §3'te tek tek yazılıdır.

Bu tutanakla birlikte teslim edilenler: kaynak kod, kullanıcı kılavuzu,
yönetici rehberi, test raporu ve API dokümanı (§2). Sözleşme madde 5.2
gereği hakların devri bu tutanağın imzasıyla başlar.

İşaretler: ✅ bitti ve yayında · ◐ bitti, son adımı Müşteri girdisine bağlı ·
⏳ Müşteri girdisi gelince yapılacak.

---

## 1. Teslim edilen modüller (madde 1.2 ve Ek-1)

| # | Sözleşme kalemi | Durum | Ne teslim edildi |
|--|------------|---|--------------|
| 1 | Klinik / hasta / doktor profilleri; foto-video galeri, fiyat, değerlendirme, sıralama | ✅ | Klinik ve doktor profil sayfaları (galeri, fiyat listesi, yorumlar sekmeleri). Doktor ve klinik aramasında puana, deneyime ve fiyata göre sıralama; para birimi seçerek en az / en çok fiyat süzgeci |
| 2 | Kullanıcı tipleri: hastane / klinik grubu, klinik, doktor, hasta; panelleri | ✅ | Dört hesap türü + yönetici; her birinin kendi paneli ve menüsü (Kullanıcı Kılavuzu §2–4) |
| 3 | Medikal sosyal ağ: akış, klinik hesapları, takip, süzgeç/arama, beğeni, ülke ve kategori seçimi | ✅ | Medstream akışı. "Doktora Sor" sözleşmede *opsiyonel*; bu ihtiyacı Vasco AI ve mesajlaşma karşılıyor |
| 4 | Gönderi tercümesi | ✅ | Her gönderide **Çevir** düğmesi. Çeviri kendi sunucumuzda yapılıyor, veri üçüncü tarafa gitmiyor |
| 5 | Güvenli veri yönetimi: HIPAA / GDPR / KVKK uyumlu belge transferi (röntgen, tahlil) | ✅ | Hasta arşivi: belgeler şifreli saklanır, süreli bağlantıyla açılır, doktor yalnız hastanın açtığını görür |
| 6 | Çok dilli site | ✅ | 22 dil; Arapça gibi sağdan sola diller dahil |
| 7 | Yapay zekâ (semptom → uzman, diyalog, hekim listesi) | ✅ | Vasco AI yayında: şikâyeti anlıyor, gerekirse soru soruyor, branş ve hekim listesi veriyor. Kendi verisiyle eğitim GPU sunucuya bağlı — §3 |
| 8 | Klinik / doktor panelleri, son kullanıcı hesapları | ✅ | CRM paneli, doktor paneli, hasta paneli |
| 9 | CRM: lead takibi, hasta takibi, satış yönetimi | ✅ | Lead hunisi, hasta kartları (Hasta 360), satışçı ataması, raporlar |
| 10 | Entegre randevu sistemi; klinik takvimleriyle entegrasyon | ✅ | Yüz yüze / görüntülü randevu, Akıllı Takvim, Google / Apple / Outlook takvim aboneliği |
| 11 | Değerlendirme + onaylı değerlendirme | ✅ | Yalnız randevusu tamamlanmış hasta yorum yazabilir; moderasyon paneli |
| 12 | Gelişmiş SEO | ✅ | Site haritası, sayfa başına başlık/açıklama, çok dilli adresler |
| 13 | Telehealth: görüntülü görüşme + simultane alt yazı + tercüme | ✅ | Kendi sunucumuzda uçtan uca şifreli görüşme. Canlı alt yazı ve karşı tarafın diline çeviri kurulu ve çalışır durumda |
| 14 | Mesajlaşma portalı (kullanıcı ↔ klinik) | ✅ | Hasta-doktor mesajlaşma, CRM mesajları, site iletişim formu |
| 15 | Hasta röntgen / tahlil güvenli transfer | ✅ | 5. maddeyle aynı altyapı |
| 16 | Profesyonel inceleme (ücretli, hekim profilinde) | ◐ | Akış ve profil gösterimi hazır. **Ücret tahsilatı** ödeme sağlayıcısı bağlanınca açılır — §3.1 |
| 17 | Tek tuşla sağlık turizmi (otel / uçak / transfer, kapora) | ⏳ | Tasarım ve karar belgesi hazır ve Müşteri'ye iletildi. Geliştirme Müşteri onayını ve API lisanslarını bekliyor — §3.2 |
| 18 | Site içi online ödeme (Visa / MC), kapora, klinik randevu ödemesi | ⏳ | Ödeme altyapısı yazıldı (fatura, iade, sağlayıcı bağlantı noktası). **Sanal POS hesabı** bekleniyor — §3.1 |

## 2. Teknik özellikler ve teslimat şekli (madde 1.3, 2.2)

| Kalem | Durum | Nerede |
|---------|--|-----------|
| Çok dilli destek | ✅ | 22 dil |
| Mobil uyumlu tasarım | ✅ | Telefon, tablet ve masaüstü genişliklerinde ölçüldü; otomatik testleri var |
| REST API altyapısı | ✅ | Arka uç kodunda; dokümanı aşağıda |
| Güvenli veri şifreleme | ✅ | Hasta dosyaları şifreli; tüm bağlantılar TLS; görüşme uçtan uca şifreli |
| Kaynak kodları (tüm dosyalar) | ✅ | Git deposu `github.com/Cross4solution/Medagama` |
| Kapsamlı teknik dokümantasyon | ✅ | Depoda `docs/` klasörü: mimari, dağıtım, yedek, olay yönetimi, uyum |
| Kullanıcı kılavuzu ve yönetici rehberi | ✅ | Bu paketteki `KULLANICI-KILAVUZU.pdf`, `YONETICI-REHBERI.pdf` |
| API dokümantasyonu | ✅ | Depoda `backend/docs/openapi.yaml` |
| Test raporu | ✅ | Bu paketteki `TEST-RAPORU.pdf` |

## 3. Müşteri'den beklenen girdiler

Aşağıdaki altı kalem Geliştirici tarafından hazır hâle getirilmiştir;
tamamlanmaları **yalnız** Müşteri'nin sağlayacağı girdilere bağlıdır.
Sözleşme madde 4.4 uyarınca API lisansları, ödeme entegrasyonları, bulut
depolama, e-posta servisi ve alan adı Müşteri sorumluluğundadır. Her kalem
daha önce de istenmiştir; tarih ve belge her maddede yazılıdır.

### 3.1 Sanal POS / ödeme sağlayıcısı hesabı

- **Ne bekleniyor:** iyzico, PayTR, Stripe gibi bir sağlayıcıda Müşteri
  adına açılmış hesap ve API anahtarları.
- **Ne açılacak:** site içi online ödeme, randevu kaporası, ücretli
  profesyonel inceleme (modül 16 ve 18).
- **Daha önce iletildi:** 12 Ağustos 2026 — "Randevu Kaporası — Ödeme
  Akışı" ve "Hasta Deneyimi" belgeleri (bu pakette `Medagama_Kapora_Akisi.pdf`).
- **Sözleşme dayanağı:** 1.2 ödeme sistemi; 4.4 ödeme entegrasyonları.

### 3.2 Sağlık turizmi kararları ve API lisansları

- **Ne bekleniyor:** taslak belgenin onayı ya da düzeltmeleri; uçuş / otel
  verisi kullanılacaksa ilgili API lisansı (Skyscanner vb.).
- **Ne açılacak:** tek tuşla paket oluşturma modülü (modül 17).
- **Daha önce iletildi:** 10 Ağustos 2026 — "Tek Tuşla Sağlık Turizmi"
  karar belgesi (bu pakette `Medagama_Tek_Tusla_Saglik_Turizmi.pdf`).
  Belge dört temel kararı ve Müşteri'nin seçeceği A / B seçeneğini içerir.
- **Sözleşme dayanağı:** Ek-1 Turizm Programı; 4.4 API lisansları.

### 3.3 GPU sunucu (ya da bulut GPU)

- **Ne bekleniyor:** GPU'lu bir sunucu ya da bulut GPU hesabı.
- **Ne açılacak:** yapay zekânın Müşteri'nin kendi verisiyle eğitilmesi
  (modül 7) ve alt yazı motorunun büyük modele taşınması (modül 13 bugün
  CPU üzerinde, küçük modelle çalışıyor).
- **Daha önce iletildi:** 12 Ağustos 2026 — "Alt Yazı Planı" belgesi;
  ayrıca 3 Ağustos 2026'da sunucu kararında GPU ihtiyacı belirtildi.
- **Sözleşme dayanağı:** Ek-1 LLM: *"ürün kullanıma açıldıktan sonra en geç
  5 ay içerisinde"*; 4.4 bulut altyapısı.

### 3.4 Alan adı (medagama.com) ve e-posta alan adı doğrulaması

- **Ne bekleniyor:** alan adının satın alınması ve DNS erişimi.
- **Ne açılacak:** kayıt ve şifre sıfırlama e-postaları (bugün hiç e-posta
  gönderilemiyor), kalıcı sertifikalar, kalıcı site adresi. Görüşme
  sunucusunun geçici sertifikası 8 Kasım 2026'da doluyor; alan adı gelmezse
  o gün yenilenmesi gerekir.
- **Daha önce iletildi:** 12 Ağustos 2026 — "E-posta Seçenekleri" belgesi;
  21 Ağustos 2026'da e-posta gönderiminin alan adı olmadan çalışamayacağı
  ayrıca bildirildi.
- **Sözleşme dayanağı:** 4.4 SMS / e-posta servisleri ve alan adı.

### 3.5 AWS / bulut depolama hesabı

- **Ne bekleniyor:** Müşteri adına AWS hesabı (Frankfurt bölgesi
  kararlaştırıldı).
- **Ne açılacak:** hasta belgelerinin ve yedeklerin buluta taşınması; bugün
  dosyalar uygulama sunucusunun diskinde şifreli duruyor.
- **Daha önce iletildi:** 12 Ağustos 2026 — "Dosya Saklama Seçenekleri"
  belgesi; aynı gün AWS Frankfurt kararı teyit edildi, hesap bekleniyor.
- **Sözleşme dayanağı:** 4.4 bulut depolama.

### 3.6 Hukuki metinler

- **Ne bekleniyor:** hukuk onaylı KVKK aydınlatma metni, kullanım şartları,
  çerez politikası; belge türüne göre yasal saklama süreleri.
- **Ne açılacak:** son metinlerin siteye konması (bugün taslak metinler
  yayında); saklama sürelerinin sistemde uygulanması.
- **Daha önce iletildi:** 12 Ağustos 2026 — "Mevzuat Uyumu: İletilmesi
  Gerekenler" ve "Saklama Süresi" belgeleri; 3 Ağustos 2026'da pazar
  kararıyla birlikte istendi.
- **Sözleşme dayanağı:** 4.2 yasal uyumluluk Müşteri'de.

### Cevap bekleyen sorular (teslimi engellemez)

Aşağıdakiler için de Müşteri'nin cevabı bekleniyor; gelmediği için bugün
makul varsayımlarla çalışıyor:

- Semptom / işlem eş anlamlı listesi (halk diliyle arama) için altı adımlı
  plan — 22 Temmuz 2026'da iletildi, yazılı onay bekleniyor.
- Klinik randevusunda görüntülü görüşme seçeneği olsun mu; randevu saat
  dilimi modeli — 11 Ağustos 2026'da soruldu.

### Sonuç

Bu girdiler Müşteri tarafından iletildiği takdirde ilgili modüller
**karşılıklı olarak en makul şekilde ve ayrı bir iş planıyla** projeye
eklenecektir. Girdiler iletilmediği sürece söz konusu kalemler bu tutanakla
askıya alınmış sayılır ve teslimin tamamlanmasına engel oluşturmaz.

## 4. Teslim sonrası

- Bakım ve destek: madde 7 uyarınca ayrı paket.
- Demo erişimi: yönetim paneline şifresiz demo girişi teslimle birlikte
  kapatılır (Yönetici Rehberi B.6).
- Kaynak kod ve fikri haklar: madde 5.2 uyarınca son ödeme ve bu tutanağın
  imzasıyla Müşteri'ye geçer.

---

**Geliştirici**  
Ad / Unvan: ____________________  İmza: ____________

**Müşteri**  
Ad / Unvan: ____________________  İmza: ____________
