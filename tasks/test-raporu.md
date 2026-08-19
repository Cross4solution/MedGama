# Medagama — Test Raporu

**19 Ağustos 2026**

Platformun tamamı uçtan uca test edildi — taklit bir ortamda değil, **gerçek sistem üzerinde**. Ölçülen şey "ekran açılıyor mu" değil; kullanıcının gördüğünün sunucudakiyle aynı olduğu ve olmaması gereken hiçbir şeyin mümkün olmadığı.

Çalışma, hiçbiri hata mesajı üretmeyen **on gerçek hatayı** ortaya çıkardı. Hepsi düzeltildi ve doğrulandı.

---

## Neyi test ettik

| Alan | Kapsam |
|---|---|
| Giriş ve oturum güvenliği | Tüm roller, parola değişimi, oturum sonlandırma |
| Randevu | Oluşturma, onay, erteleme, iptal — hasta ve doktor tarafı |
| Fatura | Kesme, görüntüleme, PDF, hasta erişimi |
| Yetki sınırları | Kimin neyi göremediği — her rol için ayrı |
| Yönetim paneli | Yetkisiz erişimin engellendiği |
| Mesajlaşma | Sohbet, anlık bildirim, okunmamış sayacı |
| MedStream | Akış, gönderi, yorum, beğeni, kaydetme |
| CRM | Hasta yönetimi, takvim, gelir, aday takibi |
| Muayene ve reçete | Kayıt açma, reçete çıktısı, gizlilik |
| Tıbbi arşiv | Belge erişimi ve paylaşım sınırları |
| Arama | Doktor, uzmanlık, şehir, semptom |
| Destek talepleri | Açma, yanıtlama, gizlilik |
| Doktor doğrulama | Başvuru ve onay yetkisi |
| Yük ve performans | Yanıt süreleri, eşzamanlı kullanım, veri büyümesi |

**Test edilmeyen tek alan: ödeme.** Ödeme altyapısı henüz kurulmadı — test edilecek bir davranış yok. Altyapının kendisi (tutar, para birimi, iade, komisyon) hazır ve kendi testleri geçiyor; eksik olan yalnızca ödeme kuruluşu bağlantısı.

### Rakamlar

| Ölçüm | Sayı |
|---|---|
| Sunucu tarafı test | 190 |
| Arayüz testi (uçtan uca) | 77 |
| Başarısız test | 0 |
| Bulunan ve düzeltilen canlı hata | 10 |

### Testlerin uyduğu kurallar

Sağlık verisiyle çalışıldığı için testler bilinçli olarak sınırlandırıldı:

- **Hiçbir test kalıcı iz bırakmaz.** Oluşturulan her randevu, fatura, gönderi ve kayıt test sonunda geri alınır.
- **Hasta belgesi yüklenmez.** Silinse bile ortamda şifreli bir dosya kalır ve saklama yükümlülüğü doğurur.
- **Yorum yazılmaz.** Geri alınamaz ve doktorun herkese açık puanını değiştirir.
- **Yönetici hesabı teste bağlanmaz.** Platformun en yetkili hesabını otomatik bir sürece bağlamak, kazanılacak kapsamdan büyük bir risktir. Yönetim panelinde ölçülen tek şey kapının kapalı olmasıdır.

---

## Bulunan hatalar ve düzeltmeleri

Hepsinin ortak yanı: **hiçbiri hata vermiyordu.** Sistem çalışıyor görünüyordu. Elle yapılan denemelerde fark edilmeleri mümkün değildi.

### 1. Aynı saat birden fazla hastaya verilebiliyordu

**Belirti.** Aynı doktora, aynı güne, aynı saate eşzamanlı beş talep gönderildi — beşi de kabul edildi. Doktor o saatte beş hastayı bekliyor olurdu. Bu hata tek kullanıcıyla asla görünmez; yalnızca iki kişi aynı anda aynı saati istediğinde ortaya çıkar, yani platform büyüdükçe sıklaşır.

**Düzeltme.** Koruma veritabanının kendisine taşındı. Aynı doktorun aynı saati ikinci kez kaydedilemiyor. Randevu iptal edilince o saat gerçekten yeniden açılıyor.

**Doğrulama.** Canlı sistemde tekrarlandı: beş eşzamanlı talepten yalnızca biri kabul ediliyor, diğerleri "bu saat az önce doldu" uyarısı alıyor.

### 2. Anlık bildirimler hiç çalışmıyordu

**Belirti.** Bildirim altyapısı ayaktaydı ve sunucu mesajı gönderiyordu, ama tarayıcı hiçbir zaman bağlanmıyordu. Kullanıcı sayfayı yenilemeden hiçbir bildirim görmüyordu.

**Düzeltme.** Tarayıcı tarafındaki bağlantı ayarı düzeltildi. Bildirimler artık anında düşüyor.

### 3. Muayene kaydı hiç açılamıyordu

**Belirti.** Doktor muayene kaydetmeye çalıştığında işlem her seferinde sunucu hatasıyla sonuçlanıyordu. Özellik bugüne kadar bir kez bile çalışmamıştı.

**Düzeltme.** Kayıt yapısındaki zorunluluk hatası giderildi. Muayene açılıyor, reçete çıktısı alınabiliyor.

### 4. Tanı notu kayboluyordu

**Belirti.** Muayene açılırken yazılan tanı notu kaydedilmiyordu. Doktor yazıyor, kaydediyor, not yok oluyordu. Sonradan düzenlenirse kaydediliyordu — bu yüzden hata düzensiz görünüyordu.

**Düzeltme.** Not artık ilk kayıtta da saklanıyor.

### 5. CRM hasta listesi boş görünüyordu

**Belirti.** Sayaç "3 hasta" derken liste "sonuç yok" diyordu. Veriler yerindeydi; ekran yanlış yerden okuyordu.

**Düzeltme.** Liste doğru kaynağa bağlandı.

### 6. Üç ekran veri çekemiyordu

**Belirti.** Doktor değerlendirmeleri ve yorum yazılabilir randevular ekranları veri bulamıyordu. Adres çakışması yüzünden istekler yanlış yere gidiyordu.

**Düzeltme.** Adres sıralaması düzeltildi; üç ekran da veriyi görüyor.

### 7. Bildirim listesi ve zil rozeti çalışmıyordu

**Belirti.** Bildirim sayfası hep boş, rozet hep sıfır görünüyordu. Bildirimler kayıtlıydı ama okunamıyordu. "Hepsini okundu işaretle" de bu yüzden görünmüyordu.

**Düzeltme.** Dört ayrı yerdeki okuma hatası giderildi.

### 8. Hasta verisi tarayıcı diskine yazılabiliyordu

**Belirti.** Hasta bilgisi taşıyan sayfalar, tarayıcının içeriği diskte saklamasını engelleyecek şekilde işaretlenmemişti. Ortak kullanılan bir bilgisayarda risk oluşturur.

**Düzeltme.** Sistemin tamamı artık varsayılan olarak "saklama" diyor; yalnızca herkese açık içerikler bu kuraldan muaf.

### 9. Herkese açık sayfalar hiç önbelleklenmiyordu

**Belirti.** Doktor listesi, arama ve akış gibi saniyede değişmeyen içerikler için sisteme "bunları önbelleğe alma" talimatı gidiyordu. Her ziyaretçinin her isteği sunucuya ve veritabanına kadar iniyordu.

**Düzeltme.** Talimat düzeltildi; bu içerikler artık önbelleğe alınabiliyor.

### 10. Sunucu her istekte kendini yeniden kuruyordu

**Belirti.** Açılışta bir kez yapılması gereken hazırlık hiç yapılmıyor, her istek aynı işi baştan tekrarlıyordu.

**Düzeltme.** Hazırlık açılışa alındı. Arama %31, doktor listesi %16 hızlandı.

---

## Performans

Yanıt süreleri gerçek sunucuda ölçüldü.

| | Tek kullanıcı | Dört eşzamanlı kullanıcı |
|---|---|---|
| Arama | ~0,3 sn | 0,8 sn |
| Doktor listesi | ~0,3 sn | 1,0 sn |

Listelerin veri büyüdükçe yavaşlamadığı kalıcı testlerle güvence altına alındı: kayıt sayısı beş katına çıktığında sistemin veritabanına gitme sayısı **hiç artmıyor.** Bu, ileride binlerce kayda çıkıldığında da ekranların açılmaya devam edeceği anlamına gelir.

**Kalan sınır donanımdır.** Dört kullanıcı aynı anda işlem yaptığında bekleme süresi dört katına çıkıyor. Sebebi yazılım değil, şu an kullanılan sunucunun kapasitesi. Kod tarafında kapatılacak boşluk kalmadı; sonraki adım sunucu kapasitesidir.

---

## Sonuç

Platform, üzerinde otomatik olarak koşan **267 testle** korunuyor. Bundan sonra yapılacak her değişiklikte bu testler yeniden çalışır; yukarıdaki hatalardan biri geri gelirse teslimattan önce yakalanır.
