# Medagama — Kullanıcı Kılavuzu

Sürüm 1.0 · Eylül 2026 · Sözleşme madde 2.2 kapsamında teslim edilen belge

Bu kılavuz Medagama'yı kullanan dört hesap türü için yazıldı: **hasta**,
**doktor**, **klinik** ve **hastane / klinik grubu**. Her bölüm, o hesabın
ekranlarını menüdeki sırayla anlatır. Adres: `https://med-gama.vercel.app`
(alan adı alınınca değişecek).

---

## 1. Herkes için ortak

### 1.1 Dil
Sağ üstteki dil seçicisinden 22 dil arasından seçim yapılır; seçim tarayıcıda
saklanır. Arapça seçilince arayüz sağdan sola döner. Sayfa adresi de dile göre
değişir (`/tr/…`, `/en/…`).

### 1.2 Kayıt ve giriş
- **Kayıt:** `/register`. Hasta ve doktor için e-posta doğrulaması gerekir;
  klinik ve hastane hesapları doğrulama beklemeden açılır.
- **Kullanıcı adı:** kayıtta zorunludur, `@kullaniciadi` biçimindedir ve
  Medstream profil adresinizi oluşturur. Yazarken alınmış mı anında görünür.
- **Giriş:** `/login`. Doktorlar `/doctor-login`, klinikler `/clinic-login`,
  hastaneler `/hospital-login` adreslerini de kullanabilir. Giriş sonrası
  herkes Medstream'e düşer.
- **Şifremi unuttum:** `/forgot-password`. *(E-posta gönderimi alan adı
  bağlandığında çalışır; bkz. teslim tutanağı.)*

### 1.3 Arama
- **Ana sayfa araması:** ülke → şehir → branş → şikâyet/işlem adımlarıyla.
- **Doktor arama:** `/search`. Sol panelde branş, şehir, dil, en az puan,
  yalnız online, yalnız doğrulanmış süzgeçleri ve **Sırala**: isim, puan,
  deneyim, fiyat (düşükten yükseğe / yüksekten düşüğe).
- **Klinik arama:** `/browse/clinics`; **tedaviler:** `/browse/treatments` ve
  `/tedaviler/<branş>/<şehir>` sayfaları.
- **Branşlar:** `/doctors-departments`.

### 1.4 Vasco AI (şikâyet → uzman)
`/vasco-ai`. Şikâyetinizi kendi dilinizde yazın; Vasco tanı koymaz, sizi doğru
branşa ve o branştaki doktorlara yönlendirir. Belirsizse bir soru daha sorar.
Örnek şikâyetler tek dokunuşla denenebilir.

### 1.5 Medstream (sosyal akış)
`/medstream`. Klinik ve doktorların paylaşımları.
- **Yeni / Öne Çıkan** sekmeleri; **Konum** düğmesiyle yakınınızdaki paylaşımlar.
- Ülke ve branş süzgeci, metin araması.
- Beğen, yorum yap, kaydet, paylaş. **Çevir** düğmesi gönderiyi sizin dilinize
  çevirir; çeviri kendi sunucumuzda yapılır.
- Klinik ve doktorları **takip edin**; takip ettikleriniz akışa düşer.
- Kaydettikleriniz `/saved`, favori klinikler `/saved-clinics`.
- Profil adresleri: `medagama.com/@kullaniciadi`.

### 1.6 Bildirimler, mesajlar
- **Bildirimler:** zil simgesi → `/notifications`. Randevu, mesaj, yorum ve
  sistem bildirimleri.
- **Mesajlar:** `/doctor-chat`. Hasta ↔ doktor/klinik yazışması; dosya
  ekleri şifreli saklanır ve süreli imzalı bağlantıyla açılır.

### 1.7 Gizlilik ve çerezler
İlk ziyarette çerez seçimi sorulur (Tümünü Reddet / Özelleştir / Kabul Et).
Verilerinizle ilgili talepler: `/data-rights`. Metinler: `/privacy`, `/kvkk`,
`/cookie-policy`, `/terms`.

---

## 2. Hasta

Sol menü: Ana Sayfa · Medstream · Panel · Kaydedilen Gönderiler · Favori
Klinikler · Randevular · Faturalar · Mesajlar · Telesağlık · Arşiv ·
Bildirimler · Profil.

### 2.1 Randevu alma
1. Doktor profilinde (`/doctor/<ad>`) **Randevu Al** ya da **Görüntülü
   Görüşme**.
2. Tür seçin: **Yüz Yüze Muayene** / **Görüntülü Görüşme**.
3. Takvimden gün, sağdaki listeden saat seçin (yeşil noktalı günlerde müsait
   saat var).
4. Not yazın, **Onayla**. Randevu *bekliyor* durumuna düşer; doktor kabul
   edince *onaylandı* olur ve bildirim gelir.
- Randevularınız: `/patient/appointments`. İptal ve yeniden planlama buradan.
- Klinik randevusu için klinik profilinde **Randevu Al**.

### 2.2 Görüntülü görüşme (telesağlık)
`/telehealth` → randevu saatinde **Görüşmeye Katıl**.
1. **Kabul et ve devam et** (kamera/mikrofon izni; görüşme uçtan uca
   şifrelidir, kaydedilmez).
2. Önizlemede kamerayı/mikrofonu seçip **Görüşmeye katıl**.
3. Alt çubuk: mikrofon, kamera, **alt yazı**, kapat.
- **Alt yazı:** düğmeye basınca karşı taraftan onay istenir; kabul ederse
  konuşmalar yazıya çevrilir ve **karşı tarafın diline** çevrilerek gösterilir.
  Kendi cümleleriniz "Siz:" ile görünür. Metin saklanmaz, görüşme bitince
  kaybolur. Çeviri kendi sunucumuzda yapılır, dışarı çıkmaz.

### 2.3 Arşiv (belgeler)
`/medical-archive`. Tahlil, röntgen, rapor yükleyin (PDF, görüntü). Belgeler
şifreli saklanır; sizden başka kimse göremez. Bir belgeyi doktorunuza açmak
için belgenin yanındaki **Paylaş** simgesini kullanın; doktor yalnız açtığınız
belgeyi, yalnız randevu bağlamında görür.

### 2.4 Değerlendirme yazma
Yalnız **tamamlanmış** randevusu olan hasta o doktor/kliniğe puan ve yorum
yazabilir; böylece sahte yorum oluşmaz. Yorum, doktorun profilindeki
**Yorumlar** sekmesinden ya da kliniğin **Yorumlar** sekmesinden yazılır;
tamamlanmış randevunuz yoksa alan görünmez. Panelinizde (`/patient-dashboard`)
değerlendirilebilecek randevular ayrıca listelenir. Yorumlar yayınlanmadan
önce moderasyona düşebilir.

### 2.5 Faturalar
`/patient/invoices`. Klinik/doktorun kestiği faturalar; PDF olarak indirilir.
*(Çevrimiçi ödeme sanal POS bağlanınca açılır; bkz. teslim tutanağı.)*

### 2.6 Profil ve ayarlar
`/profile`, `/settings`. Ad, fotoğraf, ülke/şehir, **tercih edilen dil**
(alt yazı çevirisi bu dile yapılır), takvim aboneliği (bkz. 3.4), hesap
kapatma ve veri indirme.

---

## 3. Doktor

Sol menü: Ana Sayfa · Panel · Medstream · Kaydedilen · Randevular · Gelir ·
Mesajlar · Telesağlık · Bildirimler · Profil. Altta **CRM Paneli**.

### 3.1 Doğrulama
Kayıt sonrası diploma/belge yükleyip doğrulama isteyin (`/onboarding`).
Yönetici onaylayana kadar randevu alınamaz; profil "doğrulanmamış" görünür.

### 3.2 Profil ve fiyatlar
CRM → **Ayarlar** (`/crm/settings`): unvan, branş, biyografi, eğitim,
sertifikalar, diller, adres/harita, çalışma saatleri, sigorta, **fiyatlar**
(kalem, en az / en çok, para birimi — aramada fiyat sıralaması buradan
beslenir), galeri, online görüşme açık/kapalı.

### 3.3 Randevular
`/doctor/appointments`: bekleyenleri **Kabul et / Reddet**, tamamlananları
işaretle, **gelmedi** işaretle, yeniden planla. Müsait saatler CRM →
**Akıllı Takvim** (`/crm/calendar`): tek tek ya da toplu saat açma.

### 3.4 Takvim entegrasyonu
Ayarlar → **Takvim bağlantısı**: kişisel ICS adresinizi Google / Apple /
Outlook takvimine abone olarak ekleyin; randevular otomatik görünür ve
güncellenir. Adres gizlidir, *Yenile* ile eskisi geçersiz olur.

### 3.5 Görüntülü görüşme
Hastadaki akışla aynı (bkz. 2.2). Görüşmeyi doktor başlatır.

### 3.6 Gelir ve fatura
`/doctor/billing`: fatura kes (kalem, KDV), durum (bekliyor / kısmi / ödendi),
PDF. Gelir raporu CRM → **Gelir** (premium).

### 3.7 Medstream'de paylaşım
`/medstream` → **Paylaş**: metin, fotoğraf, video (video alt yazısı otomatik
üretilir, düzenlenebilir), makale/PDF. Yorumları yanıtlayın.

---

## 4. Klinik ve hastane / klinik grubu

Sol menü: Ana Sayfa · Panel · Ekibim · Medstream · Kaydedilen · Randevular ·
Mesajlar · Bildirimler · Klinik Profili. Hastanede **CRM** en üstte ve her
zaman açık; klinikte CRM paketine bağlı.

### 4.1 Klinik profili
`/clinic-edit`: ad, açıklama, adres/harita, fotoğraf/video galerisi,
**hizmetler ve fiyat listesi** (işlem, fiyat aralığı), önce/sonra, SSS,
akreditasyonlar, çalışma saatleri. Profil `/clinic/<ad>` adresinde
sekmelerle görünür: Genel Bakış, Doktorlar, Hizmetler, Fiyatlar, Galeri,
Yorumlar, Konum.

### 4.2 Ekip
`/clinic/team`: doktor ekle (mevcut hesabı bağla ya da davet et), çıkar.
Hastane: **Şubeler** (`/crm/branches`) altında klinikleri yönetir.

### 4.3 CRM
`/crm`. Ana menü ve Yönetim bölümleri:

| Ekran | Ne yapar |
|------|--------------|
| Kontrol Paneli | Günlük randevu, yeni hasta, gelir özeti |
| Randevular | Tüm doktorların randevuları; oluştur, onayla, iptal |
| Akıllı Takvim | Doktor bazında müsaitlik; toplu saat açma |
| Hastalar | Hasta kartları, etiket, aşama; **Hasta 360** tek ekranda geçmiş |
| Lead'ler | Satış hunisi: aday hasta, aşama, kaynak, satışçı ataması |
| Muayene | Anamnez, muayene notu, reçete (hasta arşivine düşer) |
| Reçeteler | Yazılan reçeteler, PDF |
| Dökümanlar | Klinik belgeleri; hasta belgeleri şifreli |
| Mesajlar / İletişim Mesajları | Hasta yazışmaları ve site formundan gelenler |
| Tahsilat | Fatura, ödeme durumu, PDF |
| Gelir | Dönemsel gelir, doktor bazlı |
| Raporlar | Randevu, gelir, hasta raporları; CSV / PDF dışa aktar |
| Yorumlar | Kliniğe yazılan değerlendirmeler, yanıt |
| Ekip / Satışçılar | Personel ve satış ekibi hesapları |
| Klinik Yönetimi | Hastane: şube ve klinik ayarları |
| Entegrasyonlar | Takvim (ICS) bağlantısı |
| Ayarlar | Profil, fiyatlar, galeri, bildirim tercihleri |
| Yardım / SSS / Destek | Destek talebi açma |

Premium kilitli ekranlar (Telehealth, Gelir, Tahsilat, Klinik Yönetimi,
İletişim Mesajları) `/crm/upgrade` ile açılır.

### 4.4 Medstream
Klinik hesabı paylaşım yapar, yorumlara yanıt verir; kliniğe bağlı doktorların
paylaşımları klinik profilinde de görünür.

---

## 5. Sık sorulanlar

- **E-posta gelmiyor.** Kayıt/şifre e-postaları alan adı ve e-posta servisi
  bağlanınca çalışacak; bu tarafın teslimatı müşteride (tutanak).
- **Alt yazı düğmesi pasif.** Motor o an ulaşılamıyordur; en geç bir dakika
  içinde açılır. Görüşme etkilenmez.
- **Görüntü gelmiyor.** Tarayıcı kamera/mikrofon iznini kontrol edin;
  kurumsal ağlarda TURN üzerinden bağlanır, birkaç saniye sürebilir.
- **Yorum yazamıyorum.** Yalnız tamamlanmış randevusu olan hasta yazabilir.
