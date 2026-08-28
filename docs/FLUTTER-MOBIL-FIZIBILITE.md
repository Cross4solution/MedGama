# Flutter mobil uygulama — gerçekçi fizibilite

Soru: "Backend %100 sorunsuz, Flutter ile mobil yapabilir miyiz?"

Kısa cevap: **Yapılabilir, ve temel sağlam.** Ama "backend hazır, sadece
arayüz yazacağız" varsayımı doğru değil. Aşağıdakiler ölçüldü, tahmin değil.

---

## Lehimize olanlar

| | Ölçüm |
|---|---|
| API yüzeyi | **377 uç**, modüllere ayrılmış (admin 62, CRM 48, MedStream 23, randevu 11…) |
| Kimlik doğrulama | Sanctum **jeton** tabanlı (`HasApiTokens`) — çerez/SPA kipi değil, mobil için doğru olan |
| Dosya yükleme | 52 denetleyici `UploadedFile` işliyor; kamera/galeri akışı için uç var |
| Çok dillilik | 22 dil JSON olarak hazır — Flutter'a olduğu gibi taşınır |
| Test tabanı | 1179 arka uç testi yeşil; API davranışı kayıtlı ve korunuyor |

Yani "sıfırdan backend yazacağız" durumu yok. Mobilin okuyacağı veri var.

---

## Gerçek engeller — sırayla

### 1. Push bildirimi YOK  ⛔ en kritik

Ölçüm: bildirimlerin kanalları yalnız `database` (14) ve `mail` (11).
FCM/APNs **hiç yok**.

Neden kritik: sağlık uygulamasında mobilin varlık sebebi randevu
hatırlatması. Push olmadan uygulama, sitenin küçük ekranda açılmış hâli
olur — kullanıcı indirme zahmetine değmez bulur.

Üstelik `mail` kanalı da şu an ölü (alan adı yok, sistem e-posta
gönderemiyor). Yani bugün hiçbir hatırlatma kullanıcıya ulaşmıyor.

Gereken: cihaz jetonu tablosu + FCM kanalı + Flutter tarafı izinler.
**Tahmini 3-5 gün.**

### 2. API sürümlenmesi YOK  ⛔ mobile özgü tuzak

Ölçüm: `/api/v1` gibi bir önek yok (0 eşleşme).

Webde bu sorun değil: arayüzü siz dağıtırsınız, herkes anında yeni sürümü
alır. Mobilde alamaz. Kullanıcının telefonundaki sürüm haftalarca eski
kalır. Bugün bir alan adını değiştirdiğinizde eski uygulamalar kırılır ve
mağaza onayı 1-3 gün sürdüğü için hızlı düzeltemezsiniz.

Gereken: `/api/v1` öneki + "en düşük desteklenen sürüm" kontrolü (zorunlu
güncelleme ekranı). **Tahmini 2-3 gün, ama şimdi yapılmalı** — uygulama
yayına girdikten sonra çok daha pahalı.

### 3. Yanıt biçimi tutarsız  ⚠️ maliyet kalemi

Ölçüm: 48 denetleyiciden yalnız **1'i** `success` zarfı kullanıyor,
8'i `JsonResource`, 3'ü doğrudan dizi döndürüyor.

Web tarafı bunu `res?.data?.data || res?.data || res` gibi ifadelerle
idare ediyor — JavaScript esnek olduğu için görünmüyor. Dart **katı
tipli**: her uç için ayrı model ve ayrı çözümleme yazmak gerekir.

Bu bir "hata" değil, bir **maliyet**: mobil geliştirme süresine tahminen
%20-30 ekler. Alternatif, uçları tek zarfa taşımak — ama o da web
tarafını kırar.

### 4. Telesağlık (görüntülü görüşme)  ⚠️ en riskli teknik parça

Yığın: Laravel Reverb + coturn, WebRTC. Flutter'da karşılığı
`flutter_webrtc` + Pusher protokolü istemcisi. Çalışır, ama:

- iOS'ta arka planda görüşme = CallKit + VoIP push (ayrı bir iş)
- Ağ değişiminde (wifi→4G) yeniden bağlanma mantığı
- Cihaz izinleri, ekran uyandırma, arka plan sınırları

**Tahmini 2-3 hafta**, tek başına.

### 5. Ödeme — mağaza komisyonu  ⚠️ ticari karar

Ölçüm: `PaymentProvider` arayüzü yazılmış, sağlayıcı seçilmemiş
(`PAYMENT_PROVIDER` boş).

Mobile özgü sorun: Apple ve Google, **uygulama içinde satılan dijital
abonelikten %15-30 komisyon** alır. CRM aboneliğini uygulama içinden
satarsanız bu komisyon devreye girer. Randevu ücreti gibi *fiziksel
hizmet* ödemeleri komisyon dışıdır, ama sınır ince ve mağaza reddi
buradan gelir.

Karar gerekiyor: abonelik satışı uygulamada mı olacak, yoksa "web'den
yükseltin" mi denecek (Apple bunu da sınırlar).

### 6. Mağaza onayı — sağlık uygulaması  ⚠️

Sağlık kategorisinde onay daha sıkı: gizlilik etiketleri, veri toplama
beyanı, hekim doğrulaması iddiaları, KVKK/GDPR metinleri. Yasal metinler
hâlâ müşteride bekliyor. İlk gönderimde red yaygındır; **2-4 hafta
tampon** koyun.

---

## Süre tahmini

Tek deneyimli Flutter geliştiricisi, mevcut API üzerine:

| Kapsam | Süre |
|---|---|
| **Faz 1** — giriş, MedStream, arama, hekim/klinik profili, randevu alma, bildirimler | 6-8 hafta |
| **Faz 2** — mesajlaşma, belgeler, faturalar, profil | 3-4 hafta |
| **Faz 3** — telesağlık görüşmesi | 2-3 hafta |
| **Backend hazırlık** (push + sürümleme) | 1-1,5 hafta |
| Mağaza onayı ve düzeltmeler | 2-4 hafta |

**Toplam: 3,5-5 ay.** CRM panelinin tamamını mobile taşımak bu tahminin
dışında — 48 uçluk yönetim arayüzü telefonda zaten iyi bir fikir değil.

---

## Öneri

1. **Backend hazırlığını önce yapın** (push + `/api/v1` + zorunlu
   güncelleme). Bunlar uygulama yayına girmeden yapılırsa ucuz, sonra
   yapılırsa pahalı.
2. **Faz 1'i tek başına yayınlayın.** Hasta tarafı: ara, bul, randevu al,
   hatırlatma al. Uygulamanın var olma sebebi bu.
3. **CRM'i mobile taşımayın.** Klinik yöneticisi masaüstünde çalışır;
   telefon için gerekiyorsa yalnız "bugünün randevuları" ekranı yeter.
4. **Ödeme kararını mağaza komisyonuyla birlikte verin**, sonrasında
   değil.

---

## "Sorunsuz çalışma ihtimali" — ölçülebilir kısmı

Önce dürüst olalım: **"sorunsuz çalışır mı" tek bir sayıya indirgenemez.**
Ama sorunun cevabını belirleyen şeyler ölçülebilir. Aşağıdakiler ölçüldü.

### Lehte olan kanıtlar

| Ölçüm | Değer | Neden önemli |
|---|---|---|
| Web istemcisinin çağırdığı ayrı uç | **280 / 281** | API teorik değil: gerçek bir istemci her gün sürüyor. Mobilin kullanacağı uçların neredeyse tamamı canlıda çalışıyor |
| Arka uç testi | **1179 geçiyor** | Davranış kayıtlı; mobil için bir şey değiştiğinde kırılır |
| Canlıya karşı E2E | **126 test / 36 dosya** | Akışlar yalnız birim düzeyinde değil, uçtan uca kanıtlı |
| Kimlik doğrulama | Sanctum jeton | Mobil için doğru model; uyarlama gerekmiyor |

Bu, "belki çalışır" değil "çalışan bir sistemin üstüne bina" durumudur.

### Aleyhte olan ölçümler — mobilde ilk çökmeler buradan gelir

| Ölçüm | Değer | Mobilde ne olur |
|---|---|---|
| **`decimal` cast** | **15 alan** | Laravel bunları JSON'a **metin** olarak yazar (`"1250.00"`). Dart `as double` **çöker**. Fatura tutarı, enlem/boylam dahil |
| Uç test kapsamı | **151 / 377 yol** (~%40) | Kalan %60 hiç sınanmamış; mobil bunları ilk kez zorlayacak |
| Hata kodu | **10 ayrı kod** | Mobil hataya göre dallanamaz; elinde çoğu zaman yalnız yerelleştirilmiş bir metin var |
| Zarf tutarlılığı | 48 denetleyiciden **1'i** | Her uç için ayrı çözümleme |
| Sayfalama şekli | 7 Resource / 12 ham | İki farklı şekil, iki farklı model |

### Buradan çıkan tahmin

Aşağıdaki yüzdeler **ölçüm değil, ölçümlere dayanan tahmindir.** Sayı
vermemek daha kolay olurdu ama işe yaramazdı.

| Soru | Tahmin |
|---|---|
| İlk sürüm **hatasız** çıkar mı | **%5-10.** Hiçbir ilk sürüm çıkmaz; bu projeye özgü bir kötümserlik değil |
| İlk 2 hafta içinde **engelleyici** hata çıkar mı | **%60-70.** En olası ilk üç: `decimal` alanların metin gelmesi, `null` gelen alanın Dart'ta çökmesi, oturum süresi dolduğunda yenileme akışının olmaması |
| 4-6 hafta içinde **kararlı** hâle gelir mi | **%80-85.** Hataların kaynağı bilinen ve sınırlı: veri çözümleme. Mimari bir yeniden yazma gerektiren bir şey görünmüyor |
| İlk mağaza gönderiminde **reddedilir** mi | **%50+.** Sağlık kategorisi + gizlilik beyanları + (varsa) uygulama içi satın alma kuralları. Bu teknik bir başarısızlık değil, normal bir tur |
| **Telesağlık** ilk denemede sorunsuz çalışır mı | **%30-40.** Listedeki en riskli parça: iOS arka plan, CallKit, ağ değişimi |

### Bu oranları yükseltmenin ölçülebilir yolu

Aşağıdakiler yapılırsa "ilk 2 haftada engelleyici hata" ihtimali kayda
değer ölçüde düşer — hepsi arka uçta, mobil başlamadan:

1. **15 `decimal` alanı** için karar: ya sayı olarak dön, ya sözleşmede
   "metindir" diye yaz. Sessiz bırakmak en kötüsü.
2. **`/api/v1` öneki + zorunlu güncelleme kontrolü.**
3. **Push kanalı** (FCM/APNs) — bugün yalnız `database` ve `mail` var.
4. Mobilin kullanacağı ~60 ucun **sözleşme testi**: alan adları, tipleri
   ve `null` olabilirlikleri sabitlensin. Şu an bu uçların %60'ı
   sınanmamış.

Dördü de toplamda 1,5-2 haftalık iş ve doğrudan yukarıdaki yüzdeleri
oynatır.

---

## Özetle

Backend mobil için **uygun** — jeton tabanlı kimlik doğrulama, geniş uç
kümesi, test edilmiş davranış. Ama "hazır" değil: push yok, sürümleme yok,
yanıt biçimi tutarsız. Bunlar bilinmeyen riskler değil, **bilinen ve
fiyatı belli işler**. Asıl belirsizlik teknik değil ticari: ödeme modeli
ve mağaza onayı.
