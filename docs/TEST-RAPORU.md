# Medagama - Test Raporu

Sürüm 1.2, 7 Eylül 2026, Teslim tutanağının eki

## Kısaca

Sözleşmedeki her modül, kod her değiştiğinde kendiliğinden koşan otomatik
testlerle sınanıyor. Sayılar teslim edilen kaynak kod arşivi üzerinde
alındı:

| | Test sayısı | Sonuç |
|--|--|--|
| Sunucu tarafı (API, yetki, iş kuralları, veri güvenliği) | 1 071 | **hepsi geçti** |
| Arayüz birim ölçütleri (çeviri kapsamı, güvenlik başlıkları, yapı) | 355 | **hepsi geçti** |
| Gerçek tarayıcıda kullanıcı akışları (randevu, fatura, yorum, mobil) - canlı site üzerinde | 194 | **hepsi geçti** |
| Elle, canlı sitede (görüntülü görüşme + alt yazı, mobil, fiyat sıralaması) | - | **doğrulandı** (Bölüm 3) |

Başarısız test **yok**. 21 sunucu testi atlandı; bunlar yalnız canlı ortamda
anlamlı olanlar (gerçek e-posta gönderimi, hata izleme servisi, tarayıcı
iznine bağlı akışlar). Atlama gerekçesi her testin içinde yazılı; koşulu
sağlanınca kendiliğinden koşarlar.

## 1. Ne test edildi, nasıl

- **Sunucu tarafı** testleri her koşuda boş bir veritabanıyla başlar. Ödeme,
  çeviri, alt yazı ve e-posta gibi dış servisler sahteleriyle değiştirilir;
  böylece sonuç başka bir servisin o günkü durumuna bağlı olmaz.
- **Tarayıcı** testleri gerçek bir Chromium tarayıcısında, gerçek kayıt
  oluşturarak koşar: randevu alır, fatura keser, yorum yazar, mesaj
  gönderir. Mobil ölçütler telefon (320 ve 375 px) ve tablet (768 px)
  genişliğinde ölçer. Bu testler canlı site üzerinde koşuldu; demo
  hesaplara bağlı oldukları için kod arşivine dahil edilmedi.
- Ölçütlerin çoğu **karşı deneyle doğrulandı**: düzeltme geri alındığında
  testin kırmızıya döndüğü görüldü. Böylece test "her hâlükârda geçen" bir
  test değil, gerçekten o hatayı yakalayan bir test oldu.
- Sunucu ve arayüz sayıları teslim edilen kaynak kod arşivi üzerinde
  alındı; Müşteri aynı komutlarla yeniden koşabilir (Bölüm 4).

## 2. Modül > test eşlemesi (sözleşme Ek-1 ve madde 1.2)

Her satırda modülün hangi açılardan sınandığı yazılı. Test dosyalarının
adları Ek'te.

| # | Sözleşme modülü | Ne sınandı | Sonuç |
|---|----------------|-----------|--|
| 1 | Profiller, galeri, fiyat, değerlendirme, sıralama | Profil sayfaları herkese doğru açılıyor; yalnız sahibi düzenleyebiliyor; puan / deneyim / fiyat sıralaması doğru sırada; fiyat süzgeci yalnız seçilen para biriminde çalışıyor; fiyatı olmayanlar listenin sonunda | Tamam |
| 2 | Kullanıcı tipleri ve panelleri | Her rol yalnız kendi ekranlarına girebiliyor (19 yetki senaryosu); hastane şubelerini görüyor, klinik yalnız kendini; yetki yükseltme denemeleri reddediliyor | Tamam |
| 3 | Medikal sosyal ağ | Gönderi yayınlama, düzenleme, silme yalnız sahibine; beğeni, yorum, kaydet, takip; ülke ve branş süzgeci; kullanıcı adı güvenliği; indirme güvenliği | Tamam |
| 4 | Gönderi tercümesi | Çevir düğmesi, hedef dil kullanıcının seçtiği dil, çeviri bütçesi | Tamam |
| 5 | Güvenli veri (HIPAA / GDPR / KVKK), belge transferi | Hasta belgesi yalnız hastanın açtığı doktora, yalnız randevu süresince; ekler şifreli ve süreli bağlantıyla; erişim kaydı tutuluyor; KVKK hakları (indirme, silme); güvenlik başlıkları; hata izlemeye kişisel veri sızmıyor | Tamam |
| 6 | Çok dilli | 22 dilde eksik çeviri yok; İngilizce sızıntısı yok; sağdan sola dillerde hizalama; arama motoru için dil etiketleri tutarlı | Tamam |
| 7 | Yapay zekâ (Vasco) | Şikâyet > branş yönlendirmesi (9 senaryo); dış servis yanıt vermezse zaman aşımı | Tamam |
| 8 | Hesap fonksiyonları | Giriş, çıkış, tüm cihazlardan çıkış, şifre değişince eski oturumlar düşüyor, şifre sıfırlama, e-posta doğrulama, deneme sınırı | Tamam |
| 9 | CRM | CRM paketi olmayan giremiyor (16 senaryo); lead hunisi, hasta kartı, etiket, satışçı; raporlar ve dışa aktarma; gelir grafiği | Tamam |
| 10 | Randevu ve takvim | Randevu alma, kabul, red, iptal; aynı saate iki randevu alınamıyor (eşzamanlı deneme); müsaitlik; takvim aboneliği (ICS); saat dilimi; mobilde takvim seçilebilir | Tamam |
| 11 | Değerlendirme | Yalnız tamamlanmış randevusu olan hasta yorum yazabiliyor (17 senaryo); moderasyon; şikâyet | Tamam |
| 12 | SEO | Site haritası, yapısal veri, iç bağlantılar, dil etiketleri | Tamam |
| 13 | Telehealth: görüşme + alt yazı + tercüme | Görüşmeye yalnız randevunun iki tarafı girebiliyor; alt yazı oturumu yetkisiz kişiye kapalı, süresi dolan anahtar reddediliyor (7 senaryo); yayın kesilince davranış; iki tarayıcılı gerçek görüşme (Bölüm 3) | Tamam |
| 14 | Mesajlaşma | Sohbete yalnız tarafları erişebiliyor (11 senaryo); canlı bildirim gerçekten ulaşıyor; okunmamış sayacı | Tamam |
| 15 | Fatura / finans | Fatura hesabı (KDV, kısmi ödeme), hastanın yalnız kendi faturasını görmesi, ödeme akışı (sahte sağlayıcıyla, 14 senaryo) | Tamam |
| 16 | Yönetim paneli | Yönetici olmayan giremiyor; doğrulama onay / red; katalog düzenleme; salt-okunur hesap hiçbir şey değiştiremiyor | Tamam |
| 17 | Mobil uyumlu tasarım (madde 1.3) | 320 / 375 / 768 px'te yatay kayma yok; pencereler ekrana sığıyor; açılır listeler taşmıyor; dokunma hedefleri yeterli büyüklükte | Tamam |
| 18 | REST API ve dokümantasyon | Her API ucu OpenAPI belgesinde; belge ile kod eşleşiyor; sayfa boyutu sınırı; gereksiz sorgu (N+1) yok | Tamam |
| - | Yapısal korumalar | Göçler geri alınabilir; veritabanı yedeği alınıp geri yüklenebiliyor; her ekran hatasız açılıyor; erişilebilirlik; klavye odak tuzağı yok | Tamam |

## 3. Elle ve canlı sitede doğrulananlar

| Konu | Nasıl | Sonuç |
|------|-------|-------|
| Görüntülü görüşme + canlı alt yazı + çeviri | İki tarayıcı, gerçek sinyal sunucusu, Türkçe ses kaydıyla; doktor Türkçe konuştu, hasta İngilizce gördü | Doktor ekranında "Siz: ...", hasta ekranında İngilizce çeviri; 10 ses parçasının hepsi işlendi |
| Alt yazı motoru güvenliği | Sahte ve süresi dolmuş anahtarla istek | Reddedildi; geçerli anahtarla metin + çeviri (tr>en, tr>ar) |
| Canlı site sayfaları | 20 sayfa x 4 dil | Hepsi açıldı, hata yok |
| Mobil düzen (canlı) | 320 / 375 / 390 / 768 px | Yatay kayma yok |
| Vasco AI | Şikâyet metniyle | Branş + hekim listesi; belirsiz şikâyette ek soru |
| Doktor / klinik fiyat sıralama ve süzgeci | Canlı site, TRY / EUR / USD | Artan / azalan doğru; fiyatsızlar sonda; süzgeç yalnız seçili birimde |
| Sunucu sağlık kontrolleri | API, alt yazı motoru, çeviri servisi | Üçü de çalışıyor |

## 4. Yeniden koşma

```bash
# Sunucu tarafı
cd backend && php artisan test

# Arayüz birim
node --test "src/**/__tests__/*.test.mjs" "tests/unit/*.test.mjs"

```

## Ek: modül > test dosyaları

Teknik okuyucu için. Sunucu testleri `backend/tests/Feature/`, arayüz
birim testleri `src/**/__tests__/` ve `tests/unit/` altında.

| # | Sunucu testleri | Arayüz birim testleri |
|---|-----------------|-------------------|
| 1 | HerkeseAcikProfil, DoktorProfiliKapisi, DoktorSuzgecleri, DoktorSiralama, FiyatAraligiSuzgeci, AcikDoktorListesi, DoktorListesiOnbellek | klinikSayfasiVerisi, paraBirimiSecimi |
| 2 | Permissions, KayitRolKurallari, RolListesiHizalamasi, RolSabitleriKaymasi, HastaneKapsami, KlinikYoneticisiKapisi, YetkiYukseltme | - |
| 3 | MedStreamYayinVeSahiplik, MedStreamEtkilesim, MedStreamAkisSayilari, SosyalFavori, SosyalGecisler, UlkeSuzgeci, AkistaHandle, HandleGuvenligi, KaydedilenGonderiler, MedStreamIndirmeGuvenligi | - |
| 4 | CeviriDurumu, TopluCeviriButcesi | icerikCevirisiHedefDil |
| 5 | HastaBelgesiPaylasim, HassasDosyaErisim, SohbetEkiBaglantisi, SohbetEkiGizliligi, IletisimEkiGizliligi, IletisimMesajiSifreleme, SaglikErisimKaydi, RizaEtkisi, KvkkHaklari, SilmeKapsami, SaklamaSuresiBudama, Compliance, Security, GuvenlikSertlestirme, SentryVeriTemizligi, VeritabaniBaglantiGuvenligi | guvenlikBasliklari, analitikMaskeleme |
| 6 | EpostaCevirileri | ceviriAnahtarlari, ingilizceSizintisi, ceviriKapsami, hreflangTutarliligi, dilYonu |
| 7 | VascoYonlendirme, DisServisZamanAsimi | - |
| 8 | Auth, OturumYasamDongusu, PasswordChangeRevokesSessions, LogoutAllDevices, SifreSifirlama, EpostaDogrulama, KimlikHizSiniri, KullaniciAdiGeriDoldurma | - |
| 9 | CrmAbonelikKapisi, CrmHastaListesiKapsami, CrmKayitKapsami, CrmKendiKendineAcma, AdayKapsam, SatisHatti, HastaEtiketi, HastaKaydiVeCrmKapsami, KlinikYonetimYazmalari, FinansDisaAktarim, GelirGrafigi, GelirIstatistikleri | - |
| 10 | Appointment, BookingFlow, CiftRezervasyon, DoktorMusaitligi, TakvimSlotuYetki, TakvimAkisi, RandevuListesiKapsami, RandevuAnamnezErisimi, RetPenceresi, BaglantiSaatDilimi | calendarLinks |
| 11 | DoktorDegerlendirme, DegerlendirilebilirRandevu, KlinikYorumu, YorumDenetimi, YorumDenetimSayaclari, IcerikSikayeti | - |
| 12 | SiteHaritasi, OnbellekBasligi | seoJsonLd, hreflangTutarliligi, icBaglantilar |
| 13 | TelehealthKatilimci, TelesaglikDurumu, CanliAltYazi, KanalYetkilendirme, YayinKesintisi | echo |
| 14 | SohbetErisimSiniri, GercekZamanliSohbetSiniri, IletisimMesajiErisim, IletisimKutusuKapsami, ChatMedStream | - |
| 15 | FaturaHesaplama, FaturaOdemeDurumu, HekimFaturalandirma, PatientInvoiceAccess, InvoiceAccessBoundary, Payment | - |
| 16 | YoneticiYuzeyiReddi, YoneticiYetkiDegisimi, YoneticiOkumalari, YoneticiKalanUclar, YoneticiOlustur, SaltOkunurHesap, DogrulamaBasvurusu, DogrulamaBelgesiGoruntuleme, KlinikDogrulama, KatalogYazmaUclari | - |
| 17 | - | - |
| 18 | ApiBelgesi, ApiBelgelendirmesi, OnYuzApiYollari, UcSagligi, SorguYuku, SayfaBoyutuSiniri | ucParametreleri, yanitBicimi |
| - | GocGeriAlinabilirligi, IndeksSagligi, TeshisUclari, InitDbUcu, VeritabaniYedegi, TohumlamaTekrarlanabilir, TeslimHazirligi | - |
