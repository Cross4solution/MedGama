# Medagama - Proje Teslim Tutanağı

Sözleşme: Yazılım Geliştirme ve Hizmet Sözleşmesi (imza 25.08.2025) ve Ek-1

7 Eylül 2026

## Kısaca

Sözleşmede yazılı 18 modülün **15'i tamamen bitti ve yayında**. Kalan üçü
(ücretli profesyonel inceleme, sağlık turizmi paketi, online ödeme) bizim
tarafımızda hazır; tamamlanmaları yalnız Müşteri'nin sağlayacağı hesap,
onay ve lisanslara bağlı. Bu girdiler ne oldukları, ne için gerektikleri ve
daha önce ne zaman istendikleriyle birlikte Bölüm 3'te tek tek yazılıdır.

Bu tutanakla birlikte teslim edilenler: kaynak kod, kullanıcı kılavuzu,
yönetici rehberi, test raporu ve API dokümanı (Bölüm 2). Teslim edilen kaynak
kod sözleşme kapsamındaki modülleri içerir. Canlı sitede sözleşme kapsamı
dışında ek geliştirmeler de bulunmaktadır; bunlar bu teslimin kapsamı
dışındadır.

Durum sütunu: ✓ = bitti ve yayında; Kısmen = bitti, son adımı Müşteri girdisine bağlı;
Bekliyor = Müşteri girdisi gelince yapılacak.

---

## 1. Teslim edilen modüller (madde 1.2 ve Ek-1)

| # | Sözleşme kalemi | Durum | Ne teslim edildi |
|----|----------------------|-------|------------------------------------|
| 1 | Klinik / hasta / doktor profilleri; foto-video galeri, fiyat, değerlendirme, sıralama | ✓ | Klinik ve doktor profil sayfaları (galeri, fiyat listesi, yorumlar sekmeleri). Doktor ve klinik aramasında puana, deneyime ve fiyata göre sıralama; para birimi seçerek en az / en çok fiyat süzgeci |
| 2 | Kullanıcı tipleri: hastane / klinik grubu, klinik, doktor, hasta; panelleri | ✓ | Dört hesap türü + yönetici; her birinin kendi paneli ve menüsü (Kullanıcı Kılavuzu Bölüm 2-4) |
| 3 | Medikal sosyal ağ: akış, klinik hesapları, takip, süzgeç/arama, beğeni, ülke ve kategori seçimi | ✓ | Medstream akışı. "Doktora Sor" sözleşmede *opsiyonel*; bu ihtiyacı Vasco AI ve mesajlaşma karşılıyor |
| 4 | Gönderi tercümesi | ✓ | Her gönderide **Çevir** düğmesi. Çeviri kendi sunucumuzda yapılıyor, veri üçüncü tarafa gitmiyor |
| 5 | Güvenli veri yönetimi: HIPAA / GDPR / KVKK uyumlu belge transferi (röntgen, tahlil) | ✓ | Hasta arşivi: belgeler şifreli saklanır, süreli bağlantıyla açılır, doktor yalnız hastanın açtığını görür |
| 6 | Çok dilli site | ✓ | 22 dil; Arapça gibi sağdan sola diller dahil |
| 7 | Yapay zekâ (semptom > uzman, diyalog, hekim listesi) | ✓ | Vasco AI yayında: şikâyeti anlıyor, gerekirse soru soruyor, branş ve hekim listesi veriyor. Kendi verisiyle eğitim GPU sunucuya bağlı - Bölüm 3 |
| 8 | Klinik / doktor panelleri, son kullanıcı hesapları | ✓ | CRM paneli, doktor paneli, hasta paneli |
| 9 | CRM: lead takibi, hasta takibi, satış yönetimi | ✓ | Lead hunisi, hasta kartları (Hasta 360), satışçı ataması, raporlar |
| 10 | Entegre randevu sistemi; klinik takvimleriyle entegrasyon | ✓ | Yüz yüze / görüntülü randevu, Akıllı Takvim, Google / Apple / Outlook takvim aboneliği |
| 11 | Değerlendirme + onaylı değerlendirme | ✓ | Yalnız randevusu tamamlanmış hasta yorum yazabilir; moderasyon paneli |
| 12 | Gelişmiş SEO | ✓ | Site haritası, sayfa başına başlık/açıklama, çok dilli adresler |
| 13 | Telehealth: görüntülü görüşme + simultane alt yazı + tercüme | ✓ | Kendi sunucumuzda uçtan uca şifreli görüşme. Canlı alt yazı ve karşı tarafın diline çeviri kurulu ve çalışır durumda |
| 14 | Mesajlaşma portalı (kullanıcı - klinik) | ✓ | Hasta-doktor mesajlaşma, CRM mesajları, site iletişim formu |
| 15 | Hasta röntgen / tahlil güvenli transfer | ✓ | 5. maddeyle aynı altyapı |
| 16 | Profesyonel inceleme (ücretli, hekim profilinde) | Kısmen | Akış ve profil gösterimi hazır. **Ücret tahsilatı** ödeme sağlayıcısı bağlanınca açılır - Bölüm 3.1 |
| 17 | Tek tuşla sağlık turizmi (otel / uçak / transfer, kapora) | Bekliyor | Tasarım ve karar belgesi hazır ve Müşteri'ye iletildi. Geliştirme Müşteri onayını ve API lisanslarını bekliyor - Bölüm 3.2 |
| 18 | Site içi online ödeme (Visa / MC), kapora, klinik randevu ödemesi | Bekliyor | Ödeme altyapısı yazıldı (fatura, iade, sağlayıcı bağlantı noktası). **Sanal POS hesabı** bekleniyor - Bölüm 3.1 |

## 2. Teknik özellikler ve teslimat şekli (madde 1.3, 2.2)

| Kalem | Durum | Nerede |
|--------------------|-------|------------------------------|
| Çok dilli destek | ✓ | 22 dil |
| Mobil uyumlu tasarım | ✓ | Telefon, tablet ve masaüstü genişliklerinde ölçüldü; otomatik testleri var |
| REST API altyapısı | ✓ | Arka uç kodunda; dokümanı aşağıda |
| Güvenli veri şifreleme | ✓ | Hasta dosyaları şifreli; tüm bağlantılar TLS; görüşme uçtan uca şifreli |
| Kaynak kodları (tüm dosyalar) | ✓ | Bu paketteki kod arşivi `Medagama-Kaynak-Kod-2026-09-07.zip`; sözleşme kapsamındaki modüller. Canlı sitedeki ek geliştirmeler kapsam dışıdır. SHA-256: `eda33c34a8409a3cb5e4e0ca6916fd312bae010bf181199956f6b6b48b8f5ff4` (5 718 437 bayt) |
| Kapsamlı teknik dokümantasyon | ✓ | Depoda `docs/` klasörü: mimari, dağıtım, yedek, olay yönetimi, uyum |
| Kullanıcı kılavuzu ve yönetici rehberi | ✓ | Bu paketteki `KULLANICI-KILAVUZU.pdf`, `YONETICI-REHBERI.pdf` |
| API dokümantasyonu | ✓ | Depoda `backend/docs/openapi.yaml` |
| Test raporu | ✓ | Bu paketteki `TEST-RAPORU.pdf` |
| Üçüncü taraf lisans envanteri | ✓ | Bu paketteki `LISANS-ENVANTERI.pdf` |

## 3. Müşteri'den beklenen girdiler

Aşağıdaki kalemler Geliştirici tarafından hazır hâle getirilmiştir;
tamamlanmaları yalnız Müşteri'nin sağlayacağı girdilere bağlıdır. Sözleşme
madde 4.4 uyarınca API lisansları, ödeme entegrasyonları, bulut altyapısı,
e-posta servisi ve alan adı Müşteri sorumluluğundadır.

### 3.1 Sanal POS / ödeme sağlayıcısı hesabı

- **Ne bekleniyor:** iyzico, PayTR, Stripe gibi bir sağlayıcıda Müşteri
  adına açılmış hesap ve API anahtarları.
- **Ne açılacak:** site içi online ödeme, randevu kaporası, ücretli
  profesyonel inceleme (modül 16 ve 18).
- **Daha önce iletildi:** 12 Ağustos 2026, "Randevu Kaporası - Ödeme Akışı"
  belgesi (paketteki "2" klasöründe).
- **Sözleşme dayanağı:** 1.2 ödeme sistemi; 4.4 ödeme entegrasyonları.

### 3.2 Sağlık turizmi kararları ve API lisansları

- **Ne bekleniyor:** taslak belgenin onayı ya da düzeltmeleri; uçuş / otel
  verisi kullanılacaksa ilgili API lisansı.
- **Ne açılacak:** tek tuşla paket oluşturma modülü (modül 17).
- **Daha önce iletildi:** 10 Ağustos 2026, "Tek Tuşla Sağlık Turizmi" karar
  belgesi (paketteki "2" klasöründe).
- **Sözleşme dayanağı:** Ek-1 Turizm Programı; 4.4 API lisansları.

### 3.3 GPU sunucu (ya da bulut GPU)

- **Ne bekleniyor:** GPU'lu bir sunucu ya da bulut GPU hesabı.
- **Ne açılacak:** yapay zekânın Müşteri'nin kendi verisiyle eğitilmesi
  (modül 7).
- **Daha önce iletildi:** 3 Ağustos 2026, sunucu kararında.
- **Sözleşme dayanağı:** Ek-1 LLM: *"ürün kullanıma açıldıktan sonra en geç
  5 ay içerisinde"*; 4.4 bulut altyapısı.

### 3.4 Alan adı ve e-posta alan adı doğrulaması

- **Ne bekleniyor:** alan adının satın alınması ve DNS erişimi.
- **Ne açılacak:** kayıt ve şifre sıfırlama e-postaları (bugün e-posta
  gönderilemiyor), kalıcı sertifikalar ve site adresi.
- **Daha önce iletildi:** 12 ve 21 Ağustos 2026.
- **Sözleşme dayanağı:** 4.4 SMS / e-posta servisleri ve alan adı.

### 3.5 Hukuki vb. metinler

Sitede yer alacak hukuki vb. metinler Müşteri tarafından iletildiğinde
siteye eklenecektir.

## 4. Bilinen sınırlamalar

- E-posta gönderimi (kayıt doğrulama, şifre sıfırlama) alan adı bağlanana
  kadar çalışmaz (Bölüm 3.4).
- Görüşme ve alt yazı sunucusu geçici bir adres ve sertifikayla çalışır;
  sertifika 8 Kasım 2026'da dolar, alan adı gelmezse yenilenmesi gerekir.
- Canlı alt yazı, GPU olmadığı için küçük modelle çalışır; doğruluk ve
  gecikme buna göredir. Konuşmacı başına yaklaşık 4 saniyelik parçalar hâlinde
  gösterilir.
- Hasta dosyaları uygulama sunucusunun diskinde şifreli tutulur; bulut
  depolamaya taşıma Müşteri'nin sağlayacağı hesaba bağlıdır.
- Site içi kartla ödeme ve kapora, sanal POS bağlanana kadar kapalıdır
  (Bölüm 3.1).

## 5. Teslim

Bu tutanak ve ekleri 7 Eylül 2026 tarihinde Müşteri'ye elektronik
ortamda iletilmiştir.

| Geliştirici | Müşteri |
|----------------------------------|----------------------------------|
| &nbsp; | &nbsp; |
| &nbsp; | &nbsp; |
| &nbsp; | &nbsp; |
