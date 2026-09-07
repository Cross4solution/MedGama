# Medagama - Kullanıcı Kılavuzu

Sürüm 1.1, Eylül 2026, Sözleşme madde 2.2 kapsamında teslim edilen belge

## Kısaca

Medagama'da dört hesap türü var: **hasta**, **doktor**, **klinik** ve
**hastane / klinik grubu**. Bu kılavuzun 1. bölümü herkes için ortak
şeyleri (dil, kayıt, arama, sosyal akış), sonraki bölümler her hesap
türünün kendi ekranlarını menüdeki sırayla anlatır. Sonda sık sorulanlar var.

Site adresi bugün `https://med-gama.vercel.app`; alan adı bağlanınca
`medagama.com` olacak. Aşağıda adresler, sayfayı doğrudan açmak isteyenler
için parantez içinde verilmiştir; menüden gitmek yeterlidir.

---

## 1. Herkes için ortak

### 1.1 Dil
Sağ üstteki dil seçicisinden 22 dil arasından seçim yapılır; seçim
hatırlanır. Arapça gibi dillerde arayüz sağdan sola döner. Sayfa adresi de
dile göre değişir (`/tr/...`, `/en/...`).

### 1.2 Kayıt ve giriş
- **Kayıt** (`/register`): hasta ve doktor hesapları e-posta doğrulaması
  ister; klinik ve hastane hesapları doğrulama beklemeden açılır.
- **Kullanıcı adı:** kayıtta zorunludur, `@kullaniciadi` biçimindedir ve
  Medstream profil adresinizi oluşturur. Yazarken alınmış olup olmadığı
  anında görünür.
- **Giriş** (`/login`): doktor, klinik ve hastane için ayrı giriş sayfaları
  da vardır. Giriş sonrası herkes Medstream akışına düşer.
- **Şifremi unuttum** (`/forgot-password`): şifre sıfırlama e-postası,
  alan adı ve e-posta servisi bağlandığında çalışır (teslim tutanağı Bölüm 3.4).

### 1.3 Arama
- **Ana sayfa araması:** ülke > şehir > branş > şikâyet / işlem adımlarıyla.
- **Doktor arama** (`/search`): sol panelde branş, şehir, dil, en az puan,
  yalnız online, yalnız doğrulanmış süzgeçleri.
  - **Sırala:** isim, puan, deneyim, fiyat (düşükten yükseğe / yüksekten
    düşüğe).
  - **Fiyat:** para birimi seçin, en az / en çok yazın. Yalnız o para
    biriminde fiyat girmiş doktorlar karşılaştırılır; kur çevirisi yapılmaz.
- **Klinik arama** (`/browse/clinics`): ad / şehir / branş araması, aynı
  sıralama ve fiyat süzgeci.
- **Tedaviler** (`/browse/treatments`) ve **branşlar** (`/doctors-departments`).

### 1.4 Vasco AI - şikâyetten doğru uzmana
(`/vasco-ai`) Şikâyetinizi kendi dilinizde yazın. Vasco tanı koymaz; sizi
doğru branşa ve o branştaki doktorlara yönlendirir. Belirsizse bir soru
daha sorar. Örnek şikâyetler tek dokunuşla denenebilir.

### 1.5 Medstream - sosyal akış
(`/medstream`) Klinik ve doktorların paylaşımları.
- **Yeni / Öne Çıkan** sekmeleri.
- Ülke ve branş süzgeci, metin araması.
- Beğen, yorum yap, kaydet, paylaş. **Çevir** düğmesi gönderiyi sizin
  dilinize çevirir; çeviri kendi sunucumuzda yapılır, dışarı çıkmaz.
- Klinik ve doktorları **takip edin**; takip ettikleriniz akışa düşer.
- Kaydettiğiniz gönderiler ve favori klinikler sol menüde.
- Profil adresleri: `medagama.com/@kullaniciadi`.

### 1.6 Bildirimler ve mesajlar
- **Bildirimler:** üstteki zil simgesi. Randevu, mesaj, yorum ve sistem
  bildirimleri. Telefonda zile dokunmak bildirim sayfasını açar.
- **Mesajlar:** sol menüde. Hasta - doktor / klinik yazışması. Dosya ekleri
  şifreli saklanır ve süreli bağlantıyla açılır.

### 1.7 Gizlilik ve çerezler
İlk ziyarette çerez seçimi sorulur (Tümünü Reddet / Özelleştir / Kabul Et).
Verilerinizle ilgili talepler için **Veri hakları** sayfası (`/data-rights`);
gizlilik, KVKK, çerez ve kullanım şartları metinleri sayfa altındaki
bağlantılarda.

---

## 2. Hasta

**5 dakikada:** kayıt ol > doktor ara > **Randevu Al** > randevu saatinde
**Görüşmeye Katıl** ya da kliniğe git > görüşme bitince yorum yaz.

Sol menü: Ana Sayfa, Medstream, Panel, Kaydedilen Gönderiler, Favori
Klinikler, Randevular, Faturalar, Mesajlar, Telesağlık, Arşiv ,
Bildirimler, Profil.

### 2.1 Randevu alma
1. Doktor profilinde **Randevu Al** ya da **Görüntülü Görüşme**.
2. Tür seçin: **Yüz Yüze Muayene** / **Görüntülü Görüşme**.
3. Takvimden gün, yanındaki listeden saat seçin (yeşil noktalı günlerde
   müsait saat var).
4. Not yazın, **Onayla**. Randevu *bekliyor* durumuna düşer; doktor kabul
   edince *onaylandı* olur ve bildirim gelir.
- Randevularınız **Randevular** menüsünde; iptal ve yeniden planlama oradan.
- Klinik randevusu için klinik profilinde **Randevu Al**.

### 2.2 Görüntülü görüşme (telesağlık)
**Telesağlık** menüsü > randevu saatinde **Görüşmeye Katıl**.
1. **Kabul et ve devam et** (kamera / mikrofon izni). Görüşme uçtan uca
   şifrelidir ve kaydedilmez.
2. Önizlemede kamerayı / mikrofonu seçip **Görüşmeye katıl**.
3. Alt çubuk: mikrofon, kamera, **alt yazı**, kapat.

**Alt yazı:** düğmeye basınca karşı taraftan onay istenir. Kabul ederse
konuşmalar yazıya çevrilir ve **karşı tarafın diline** çevrilerek gösterilir;
kendi cümleleriniz "Siz:" ile görünür. Metin saklanmaz, görüşme bitince
kaybolur. Çeviri kendi sunucumuzda yapılır, dışarı çıkmaz. Hedef dil,
Profil'deki **tercih edilen dil**dir.

### 2.3 Arşiv - belgeleriniz
**Arşiv** menüsü. Tahlil, röntgen, rapor yükleyin (PDF, görüntü). Belgeler
şifreli saklanır; sizden başka kimse göremez. Bir belgeyi doktorunuza
açmak için belgenin yanındaki **Paylaş** simgesini kullanın; doktor yalnız
açtığınız belgeyi, yalnız o randevu süresince görür.

### 2.4 Yorum yazma
Yalnız **tamamlanmış** randevusu olan hasta o doktora ya da kliniğe puan
ve yorum yazabilir; böylece sahte yorum oluşmaz. Yorum, doktor ya da
klinik profilindeki **Yorumlar** sekmesinden yazılır; tamamlanmış
randevunuz yoksa alan görünmez. Panelinizde yorum bekleyen randevular
ayrıca listelenir. Yorumlar yayınlanmadan önce denetimden geçebilir.

### 2.5 Faturalar
**Faturalar** menüsü. Klinik / doktorun kestiği faturalar; PDF olarak
indirilir. Site içinden kartla ödeme, sanal POS bağlanınca açılır (teslim
tutanağı Bölüm 3.1).

### 2.6 Profil ve ayarlar
**Profil** menüsü: ad, fotoğraf, ülke / şehir, **tercih edilen dil** (alt
yazı çevirisi bu dile yapılır), "içerikler benim dilimde görünsün"
anahtarı, takvim aboneliği (bkz. 3.4), hesap kapatma ve veri indirme.

---

## 3. Doktor

**5 dakikada:** kayıt ol > belge yükleyip doğrulama iste > CRM > Ayarlar'da
profil ve fiyatları gir > Akıllı Takvim'de müsait saat aç > gelen
randevuları kabul et.

Sol menü: Ana Sayfa, Panel, Medstream, Kaydedilen, Randevular, Gelir ,
Mesajlar, Telesağlık, Bildirimler, Profil. Altta **CRM Paneli**.

### 3.1 Doğrulama
Kayıt sonrası diploma / belge yükleyip doğrulama isteyin. Yönetici
onaylayana kadar size randevu alınamaz; profiliniz "doğrulanmamış" görünür.

### 3.2 Profil ve fiyatlar
**CRM > Ayarlar:** unvan, branş, biyografi, eğitim, sertifikalar, diller,
adres / harita, çalışma saatleri, sigorta, galeri, online görüşme açık /
kapalı. **Fiyatlar:** kalem adı, en az / en çok, para birimi. Aramadaki
fiyat sıralaması ve süzgeci buradan beslenir; fiyat girmezseniz fiyat
sıralamasında sonda görünürsünüz.

### 3.3 Randevular
**Randevular** menüsü: bekleyenleri **Kabul et / Reddet**, tamamlananları
işaretle, gelmeyeni işaretle, yeniden planla. Müsait saatler **CRM >
Akıllı Takvim**: tek tek ya da toplu saat açma.

### 3.4 Takvim entegrasyonu
**Ayarlar > Takvim bağlantısı:** kişisel takvim adresinizi Google / Apple /
Outlook takvimine abone olarak ekleyin; randevular otomatik görünür ve
güncellenir. Adres gizlidir; **Yenile** ile eskisi geçersiz olur.

### 3.5 Görüntülü görüşme
Hastadaki akışla aynı (bkz. 2.2). Görüşmeyi doktor başlatır.

### 3.6 Gelir ve fatura
**Gelir** menüsü: fatura kes (kalem, KDV), durum (bekliyor / kısmi / ödendi),
PDF. Dönemsel gelir raporu **CRM > Gelir** (CRM paketi).

### 3.7 Medstream'de paylaşım
**Medstream > Paylaş:** metin, fotoğraf, video, makale / PDF. Yorumları yanıtlayın.

---

## 4. Klinik ve hastane / klinik grubu

**5 dakikada:** kayıt ol > **Klinik Profili**'nde bilgileri ve fiyat
listesini gir > **Ekibim**'de doktorları bağla > CRM'den randevu ve
hastaları yönet.

Sol menü: Ana Sayfa, Panel, Ekibim, Medstream, Kaydedilen, Randevular ,
Mesajlar, Bildirimler, Klinik Profili. Hastanede **CRM** en üstte ve her
zaman açık; klinikte CRM paketine bağlı.

### 4.1 Klinik profili
**Klinik Profili:** ad, açıklama, adres / harita, fotoğraf / video galerisi,
önce / sonra, çalışma saatleri. **Hizmetler ve fiyat
listesi:** işlem adı, en az / en çok, para birimi. Klinik listesindeki
fiyat sıralaması ve süzgeci buradan beslenir. Profil ziyaretçiye sekmelerle
görünür: Genel Bakış, Doktorlar, Hizmetler, Fiyatlar, Galeri, Yorumlar, Konum.

### 4.2 Ekip
**Ekibim:** doktor ekle (mevcut hesabı bağla ya da davet et), çıkar.
Hastane: **CRM > Şubeler** altında kliniklerini yönetir.

### 4.3 CRM
| Ekran | Ne yapar |
|------|--------------|
| Kontrol Paneli | Günlük randevu, yeni hasta, gelir özeti |
| Randevular | Tüm doktorların randevuları; oluştur, onayla, iptal |
| Akıllı Takvim | Doktor bazında müsaitlik; toplu saat açma |
| Hastalar | Hasta kartları, etiket, aşama; **Hasta 360** tek ekranda geçmiş |
| Lead'ler | Satış hunisi: aday hasta, aşama, kaynak, satışçı ataması |
| Dökümanlar | Klinik belgeleri; hasta belgeleri şifreli |
| Mesajlar / İletişim Mesajları | Hasta yazışmaları ve site formundan gelenler |
| Tahsilat | Fatura, ödeme durumu, PDF |
| Gelir | Dönemsel gelir, doktor bazlı |
| Raporlar | Randevu, gelir, hasta raporları; CSV / PDF dışa aktar |
| Yorumlar | Kliniğe yazılan değerlendirmeler, yanıt |
| Ekip / Satışçılar | Personel ve satış ekibi hesapları |
| Klinik Yönetimi | Hastane: şube ve klinik ayarları |
| Entegrasyonlar | Takvim bağlantısı |
| Ayarlar | Profil, fiyatlar, galeri, bildirim tercihleri |

CRM paketine bağlı ekranlar (Telesağlık, Gelir, Tahsilat, Klinik Yönetimi,
İletişim Mesajları) **CRM'e yükselt** düğmesiyle açılır.

### 4.4 Medstream
Klinik hesabı paylaşım yapar, yorumlara yanıt verir; kliniğe bağlı
doktorların paylaşımları klinik profilinde de görünür.

---

## 5. Sık sorulanlar

- **E-posta gelmiyor.** Kayıt ve şifre e-postaları, alan adı ve e-posta
  servisi bağlanınca çalışacak (teslim tutanağı Bölüm 3.4).
- **Alt yazı düğmesi pasif.** Alt yazı motoru o an ulaşılamıyordur; en geç
  bir dakika içinde açılır. Görüşme etkilenmez.
- **Görüntü gelmiyor.** Tarayıcının kamera / mikrofon iznini kontrol edin.
  Kurumsal ağlarda bağlantı birkaç saniye sürebilir.
- **Yorum yazamıyorum.** Yalnız tamamlanmış randevusu olan hasta yazabilir.
- **Fiyat sıralamasında doktorum sonda.** Profilde fiyat girilmemiştir;
  CRM > Ayarlar'dan girin.
- **Aramada bazı doktorlar fiyat süzgecine takılmıyor.** Süzgeç yalnız
  seçtiğiniz para biriminde fiyat girenleri karşılaştırır; para birimini
  değiştirip deneyin.
