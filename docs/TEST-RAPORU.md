# Medagama — Test Raporu

Sürüm 1.0 · 7 Eylül 2026 · Teslim tutanağının eki

Bu rapor, sözleşme Ek-1'deki her modülün hangi otomatik testlerle sınandığını
ve son koşunun sonucunu gösterir. Sayılar bu raporun yazıldığı gün, teslim
edilen kaynak kod üzerinde koşularak alınmıştır; komutlar §5'te, herkes
yeniden koşabilir.

## 1. Özet

| Paket | Ne sınıyor | Sonuç |
|-------|-----------|-------|
| Arka uç (Laravel, PHPUnit) — 184 dosya | API uçları, yetki sınırları, iş kuralları, veri güvenliği, göçler | **1197 geçti · 0 kırmızı · 21 atlandı** (3 346 doğrulama) |
| Ön yüz birim (Node) — 68 dosya | Yardımcılar, çeviri kapsamı, güvenlik başlıkları, yapısal ölçütler | **375 geçti · 0 kırmızı** |
| Uçtan uca (Playwright, Chromium) — 39 senaryo dosyası | Gerçek tarayıcıda, gerçek kayıt oluşturarak kullanıcı akışları; mobil düzen; erişilebilirlik | **{{E2E_SONUC}}** |
| Elle / canlıda doğrulama | Görüntülü görüşme + alt yazı (iki tarayıcı), canlı site ölçümleri | §4 |

**Atlanan 21 arka uç testi:** yalnız canlı ortamda ya da dış servisle
anlamlı olanlar (gerçek e-posta gönderimi, Sentry, yönetici ortam
değişkeni gerektirenler). Atlama gerekçesi her testin içinde yazılıdır.

## 2. Modül → test eşlemesi (sözleşme Ek-1 ve madde 1.2)

| # | Sözleşme modülü | Arka uç testleri | Uçtan uca / birim |
|---|----------------|-----------------|-------------------|
| 1 | Klinik/doktor/hasta profilleri, galeri, fiyat, değerlendirme, **sıralama** | HerkeseAcikProfil, ProfilVarliklariSahiplik, DoktorProfiliKapisi, DoktorSuzgecleri, **DoktorSiralama, FiyatAraligiSuzgeci**, AcikDoktorListesi, DoktorListesiOnbellek | dinamik-sayfalar, arama-ve-arsiv, profil, klinikSayfasiVerisi, paraBirimiSecimi |
| 2 | Kullanıcı tipleri ve panelleri (hasta/doktor/klinik/hastane) | Permissions (19), KayitRolKurallari, RolListesiHizalamasi, RolSabitleriKaymasi, HastaneKapsami, KlinikYoneticisiKapisi, YetkiYukseltme | rol-uc-uyumu, yetki-sinirlari, hastane-ekranlari, giris |
| 3 | Medikal sosyal ağ (feed, takip, beğeni, süzgeç, arama) | MedStreamYayinVeSahiplik (14), MedStreamEtkilesim (15), MedStreamAkisSayilari, SosyalFavori, SosyalGecisler, UlkeSuzgeci, AkistaHandle, HandleGuvenligi, KaydedilenGonderiler, MedStreamIndirmeGuvenligi | medstream, sohbet-ve-canli-bildirim |
| 4 | Gönderi tercümesi | CeviriDurumu, TopluCeviriButcesi, VideoSubtitle (10) | dil-ve-icerik-cevirisi, icerikCevirisiHedefDil, vtt |
| 5 | Güvenli veri (HIPAA/GDPR/KVKK), belge transferi | HastaBelgesiPaylasim (14), HassasDosyaErisim, SohbetEkiBaglantisi, SohbetEkiGizliligi, IletisimEkiGizliligi, IletisimMesajiSifreleme, SaglikErisimKaydi, RizaEtkisi, KvkkHaklari, SilmeKapsami, SaklamaSuresiBudama, Compliance, Security (15), GuvenlikSertlestirme, SentryVeriTemizligi, VeritabaniBaglantiGuvenligi | arama-ve-arsiv, dogrulama-belgesi, guvenlikBasliklari, analitikMaskeleme |
| 6 | Çok dilli | EpostaCevirileri | dil-ve-icerik-cevirisi, yazi-yonu-hizasi (RTL), ceviriAnahtarlari, ingilizceSizintisi, ceviriKapsami, hreflangTutarliligi, dilYonu |
| 7 | LLM (Vasco) | VascoYonlendirme (9), DisServisZamanAsimi | — (canlıda elle, §4) |
| 8 | Paneller ve hesap fonksiyonları | Auth, OturumYasamDongusu, PasswordChangeRevokesSessions, LogoutAllDevices, SifreSifirlama, EpostaDogrulama, KimlikHizSiniri, KullaniciAdiGeriDoldurma | giris, oturum-dusunce, profil, bildirimler |
| 9 | CRM (lead, hasta, satış) | CrmAbonelikKapisi (16), CrmHastaListesiKapsami, CrmKayitKapsami, CrmKendiKendineAcma, AdayKapsam, SatisHatti, HastaEtiketi, HastaKaydiVeCrmKapsami, RaporVeSss, KlinikYonetimYazmalari, FinansDisaAktarim, GelirGrafigi, GelirIstatistikleri | crm-ekranlari, crm-randevular, muayene-ve-destek |
| 10 | Randevu sistemi + takvim entegrasyonu | Appointment, BookingFlow, CiftRezervasyon, DoktorMusaitligi, TakvimSlotuYetki (12), TakvimAkisi (ICS), RandevuListesiKapsami, RandevuAnamnezErisimi, RetPenceresi, BaglantiSaatDilimi | randevu-yasam-dongusu, randevu-doktor-islemleri, randevu-eszamanlilik, randevular, mobil-randevu-takvimi, calendarLinks |
| 11 | Değerlendirme + onaylı değerlendirme | DoktorDegerlendirme (17), DegerlendirilebilirRandevu, KlinikYorumu, YorumDenetimi, YorumDenetimSayaclari, IcerikSikayeti | degerlendirmeler |
| 12 | SEO | SiteHaritasi, OnbellekBasligi | seoJsonLd, hreflangTutarliligi, icBaglantilar |
| 13 | Telehealth: görüşme + alt yazı + tercüme | TelehealthKatilimci, TelesaglikDurumu, TelesaglikTranskripti, **CanliAltYazi (7)**, KanalYetkilendirme (11), YayinKesintisi | gorusme, telesaglikTranskripti, echo; iki tarayıcılı gerçek görüşme (§4) |
| 14 | Mesajlaşma portalı | SohbetErisimSiniri (11), GercekZamanliSohbetSiniri (11), IletisimMesajiErisim, IletisimKutusuKapsami, ChatMedStream | sohbet-ve-canli-bildirim |
| 15 | Fatura / finans | FaturaHesaplama (11), FaturaOdemeDurumu, HekimFaturalandirma, PatientInvoiceAccess, InvoiceAccessBoundary, Payment (14, sahte sağlayıcı) | faturalar, fatura-yasam-dongusu |
| 16 | Yönetim paneli | YoneticiYuzeyiReddi, YoneticiYetkiDegisimi, YoneticiOkumalari, YoneticiKalanUclar, YoneticiOlustur, SaltOkunurHesap, DogrulamaBasvurusu, DogrulamaBelgesiGoruntuleme, KlinikDogrulama (14), KatalogYazmaUclari (14), DuyuruGorunurluk, DestekTalebi (13), DemoYoneticiGirisi | yonetim-paneli, dogrulama-belgesi |
| 17 | Mobil uyumlu tasarım (madde 1.3) | — | mobil-yatay-kayma (375/320/768), mobil-pencere, mobil-acilir-liste, mobil-randevu-takvimi, mobil-gorunum, dokunma-hedefleri, genel-tarayici-uyumu |
| 18 | REST API ve dokümantasyon (1.3, 2.2) | ApiBelgesi (uç ↔ OpenAPI eşleşmesi), ApiBelgelendirmesi, OnYuzApiYollari, UcSagligi, SorguYuku (N+1), SayfaBoyutuSiniri | ucParametreleri, yanitBicimi |
| — | Yapısal korumalar | GocGeriAlinabilirligi, IndeksSagligi, TeshisUclari, InitDbUcu, VeritabaniYedegi (yedek + geri yükleme), TohumlamaTekrarlanabilir, TeslimHazirligi | genis-tarama (her ekran), istek-yogunlugu, erisilebilirlik, gizli-odak-tuzagi, hata-yolu-uyarilari, yukleme-hatasi-durumlari |

## 3. Yöntem

- **Arka uç** testleri her koşuda boş bir veritabanıyla başlar; dış servisler
  (ödeme, çeviri, alt yazı motoru, e-posta) sahte uygulamalarla değiştirilir
  ki sonuç başkasının kotasına bağlı olmasın.
- **Uçtan uca** testler gerçek tarayıcıda, gerçek kayıt oluşturarak koşar
  (randevu, fatura, yorum). Mobil ölçütler iPhone 13 Mini profiliyle 375 ve
  320 px'te, tablet için 768 px'te ölçer.
- Ölçütlerin çoğu **mutasyonla doğrulandı**: düzeltme geri alındığında testin
  kırmızıya döndüğü görülmüştür (örn. sıralama, fiyat süzgeci, alt yazı
  jetonu, mobil takvim).

## 4. Elle ve canlıda doğrulananlar

| Konu | Nasıl | Sonuç |
|------|-------|-------|
| Görüntülü görüşme + canlı alt yazı + çeviri | İki tarayıcı, gerçek sinyal sunucusu, Türkçe kayıtla sahte mikrofon; doktor (tr) → hasta (en) | Doktor ekranında "Siz: …", hasta ekranında İngilizce çeviri; 10 parça, hepsi 200 |
| Alt yazı motoru | Sahte/süresi dolmuş jetonla istek | 401; geçerli jetonla metin + çeviri (tr→en, tr→ar) |
| Canlı site rotaları | 20 rota × tr/en/de/ar | Hepsi 200, hata sınırı yok |
| Mobil düzen (canlı) | 320/375/390/768 px | Yatay kayma 0, kart/iskelet/ortalama ölçümleri raporlandı |
| Vasco AI | Şikâyet metniyle uç | Branş + hekim listesi; belirsizde ek soru |
| API sağlığı | `/api/health`, `/stt/health`, `/lt/languages` | ok |

## 5. Yeniden koşma

```bash
# Arka uç
cd backend && php artisan test

# Ön yüz birim
node --test "src/**/__tests__/*.test.mjs" "tests/unit/*.test.mjs"

# Uçtan uca (yerel yığına karşı)
E2E_BASE_URL=http://127.0.0.1:3000 E2E_API_ORIGIN=http://127.0.0.1:8001 \
E2E_DEMO_KEY=<demo anahtarı> npx playwright test --project=chromium
```
Yönetici senaryoları için ayrıca `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`.
