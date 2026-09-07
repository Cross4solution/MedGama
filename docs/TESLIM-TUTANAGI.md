# Medagama — Proje Teslim Tutanağı

Sözleşme: Yazılım Geliştirme ve Hizmet Sözleşmesi (imza 25.08.2025) ve Ek-1

Tarih: ___ / ___ / 2026

Bu tutanak, sözleşme madde 1.2 (Ana Modüller), 1.3 (Teknik Özellikler),
2.2 (Teslimat Şekli) ve Ek-1'de yazılı her kalemi tek tek ele alır; teslim
edileni, nerede olduğunu ve müşteriden beklenen girdileri belirtir.
Sözleşme madde 5.2 gereği hakların devri bu tutanağın imzasıyla başlar.

---

## 1. Teslim edilen modüller (madde 1.2 ve Ek-1)

| # | Sözleşme kalemi | Durum | Nerede / nasıl |
|--|------------|---|--------------|
| 1 | Klinik / hasta / doktor profil yönetimi; foto-video galeri, fiyatlandırma, değerlendirme, sıralama | ✅ | `/clinic/<ad>` (Galeri, Fiyatlar, Yorumlar sekmeleri), `/doctor/<ad>`, `/search` ve `/browse/clinics`: puan / deneyim / fiyat sıralaması, para birimine göre fiyat aralığı süzgeci |
| 2 | Kullanıcı tipleri: hastane/klinik grubu, klinik, doktor, hasta; panelleri ve hesap fonksiyonları | ✅ | 4 rol + yönetici; her rolün paneli ve menüsü (Kullanıcı Kılavuzu §2–4) |
| 3 | Medikal sosyal ağ: feed, klinik hesapları, klinik doktor sayfaları, takip, filtreleme/arama, beğeni, ülke ve kategori seçimi | ✅ | Medstream `/medstream`; "Doktora Sor" sözleşmede *opsiyonel* — Vasco AI ve mesajlaşma bu ihtiyacı karşılar |
| 4 | Gönderi tercümesi (3. parti API) | ✅ | Her gönderide **Çevir**; çeviri artık kendi sunucumuzdaki LibreTranslate ile (veri dışarı çıkmaz) |
| 5 | Güvenli veri yönetimi: HIPAA/GDPR/KVKK uyumlu dosya transferi (röntgen, tahlil) | ✅ | Arşiv `/medical-archive`; belgeler şifreli, süreli imzalı bağlantı, hasta onayı |
| 6 | Çok dilli (yapay zekâ ile) | ✅ | 22 dil, RTL dahil |
| 7 | LLM entegrasyonu (semptom → uzman, diyalog, hekim listesi) | ✅ | Vasco AI `/vasco-ai`; diyalog + hekim eşleme canlı. Kendi verisiyle GPU'da eğitim: sözleşme *"yayından sonra en geç 5 ay"* — bkz. §3 |
| 8 | Klinik/doktor panelleri, son kullanıcı hesapları | ✅ | CRM `/crm`, doktor paneli, hasta paneli |
| 9 | CRM: lead takibi, hasta takibi, satış yönetimi | ✅ | `/crm/leads`, `/crm/patients`, `/crm/salespeople`, raporlar |
| 10 | Entegre randevu sistemi; klinik takvimleriyle entegrasyon | ✅ | Randevu (yüz yüze / görüntülü), Akıllı Takvim, ICS aboneliği (Google/Apple/Outlook) |
| 11 | Değerlendirme + onaylı değerlendirme (yalnız sistemden randevu alan) | ✅ | Yalnız *tamamlanmış* randevusu olan hasta yorum yazabilir; moderasyon paneli |
| 12 | Gelişmiş SEO | ✅ | sitemap, robots, sayfa başına meta/canonical, çok dilli adresler |
| 13 | Telehealth: entegre görüntülü görüşme + simultane altyazı + tercüme | ✅ | Kendi sunucumuzda WebRTC (uçtan uca şifreli); canlı alt yazı ve karşı tarafın diline çeviri kurulu ve çalışır durumda |
| 14 | Mesajlaşma portalı (son kullanıcı ↔ klinik) | ✅ | `/doctor-chat`, CRM Mesajlar, İletişim Mesajları |
| 15 | Hasta röntgen/tahlil güvenli transfer (HTTPS) | ✅ | Madde 5 ile aynı altyapı |
| 16 | Profesyonel inceleme (ücretli, hekim profilinde) | ◐ | Akış kartı ve profil gösterimi hazır; **ücretli talep** ödeme sağlayıcısına bağlı — bkz. §3 |
| 17 | Tek tuşla sağlık turizmi programı (otel/uçak/transfer, kapora) | ⏳ | Tasarım ve karar dokümanı hazır (`docs/Medagama_Tek_Tusla_Saglik_Turizmi.pdf`, `Medagama_Kapora_Akisi.pdf`); geliştirme müşteri onayı ve API lisanslarını bekliyor — bkz. §3 |
| 18 | Sitenin kendi içinde online ödeme (Visa/MC), kapora, klinik randevu ödemesi | ⏳ | Ödeme altyapısı yazıldı (sağlayıcı soyutlaması, fatura, iade); **sanal POS** müşteriden bekleniyor — bkz. §3 |

## 2. Teknik özellikler ve teslimat şekli (madde 1.3, 2.2)

| Kalem | Durum | Nerede |
|---------|--|-----------|
| Çok dilli destek | ✅ | 22 dil |
| Mobil uyumlu responsive tasarım | ✅ | 320 / 375 / 768 / 1024 px ölçüldü; ölçütler `tests/e2e/mobil-*.spec.js` |
| REST API altyapısı | ✅ | `backend/routes/api.php` |
| Güvenli veri şifreleme | ✅ | PHI dosyaları AES, TLS her yerde, DTLS-SRTP görüşme |
| Kaynak kodları (tüm dosyalar) | ✅ | Git deposu `github.com/Cross4solution/Medagama` |
| Kapsamlı teknik dokümantasyon | ✅ | `docs/` (mimari, dağıtım, yedek, olay yönetimi, RPO/RTO, uyum) |
| Kullanıcı kılavuzu ve yönetici rehberi | ✅ | `docs/KULLANICI-KILAVUZU.md/.pdf`, `docs/YONETICI-REHBERI.md/.pdf` |
| API dokümantasyonu | ✅ | `backend/docs/openapi.yaml` |
| Test raporu (modül → test eşlemesi, son koşu sonuçları) | ✅ | `docs/TEST-RAPORU.md/.pdf` |

## 3. Müşteriden beklenen girdiler

Aşağıdaki kalemler Geliştirici tarafından hazır hâle getirilmiş olup
tamamlanmaları **yalnız** Müşteri'nin sağlayacağı girdilere bağlıdır.
Sözleşme madde 4.4 uyarınca API lisansları, ödeme sistemi entegrasyonları,
bulut depolama, e-posta servisleri ve alan adı Müşteri sorumluluğundadır.

| Girdi | Bekleyen iş | Sözleşme dayanağı |
|----------|----------|--------|
| **Sanal POS / ödeme sağlayıcısı** hesabı (iyzico, PayTR, Stripe vb.) | Online ödeme, kapora tahsilatı, ücretli profesyonel inceleme | 1.2 ödeme sistemi; 4.4 ödeme entegrasyonları |
| **Sağlık turizmi kararları** (taslak PDF onayı) + uçak/otel API lisansları (Skyscanner vb.) | Tek tuşla paket oluşturma modülü | Ek-1 Turizm Programı; 4.4 API lisansları |
| **GPU sunucu** (ya da bulut GPU) | LLM'in kendi verisiyle eğitimi; alt yazı motorunun GPU'ya taşınması | Ek-1 LLM: *"ürün kullanıma açıldıktan sonra en geç 5 ay içerisinde"*; 4.4 bulut |
| **Alan adı** (medagama.com) + e-posta alan adı doğrulaması | Kayıt/şifre e-postaları, sertifikalar, adresler | 4.4 SMS/e-posta servisleri |
| **AWS / bulut depolama** hesabı | PHI dosyalarının ve yedeklerin buluta taşınması | 4.4 bulut depolama |
| **Hukuki metinler** (KVKK aydınlatma, kullanım şartları — hukuk onaylı) | Son metinlerin siteye konması | 4.2 yasal uyumluluk müşteride |

Bu girdiler Müşteri tarafından iletildiği takdirde ilgili modüller,
**karşılıklı olarak en makul şekilde ve ayrı bir iş planıyla** projeye
eklenecektir. Girdiler iletilmediği sürece söz konusu kalemler bu tutanakla
askıya alınmış sayılır ve teslimin tamamlanmasına engel oluşturmaz.

## 4. Teslim sonrası

- Bakım ve destek: madde 7 uyarınca ayrı paket.
- Demo erişimi: `DEMO_ADMIN_AUTO_LOGIN` teslimle birlikte kapatılır.
- Kaynak kod ve fikri haklar: madde 5.2 uyarınca son ödeme ve bu tutanağın
  imzasıyla Müşteri'ye geçer.

---

**Geliştirici**  
Ad / Unvan: ____________________  İmza: ____________

**Müşteri**  
Ad / Unvan: ____________________  İmza: ____________
