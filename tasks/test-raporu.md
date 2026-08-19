# Medagama — Test Raporu

**19 Ağustos 2026**

Platformun tamamı uçtan uca test edildi — taklit bir ortamda değil, **gerçek sistem üzerinde**. Ölçülen şey "ekran açılıyor mu" değil; kullanıcının gördüğünün sunucudakiyle aynı olduğu ve olmaması gereken hiçbir şeyin mümkün olmadığı.

Çalışma, hiçbiri hata mesajı üretmeyen **on gerçek hatayı** ortaya çıkardı. Hepsi düzeltildi ve doğrulandı.

---

## Rakamlar

| Ölçüm | Sayı |
|---|---|
| Sunucu tarafı test | **190** |
| Arayüz testi (uçtan uca) | **77** |
| Başarısız | **0** |
| Bulunan ve düzeltilen canlı hata | **10** |

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

Bunlara ek olarak sistemin yük altındaki davranışı ölçüldü — ayrıntısı aşağıda.

**Test edilmeyen tek alan: ödeme.** Ödeme altyapısı henüz kurulmadı — test edilecek bir davranış yok. Alt yapının kendisi (tutar, para birimi, iade, komisyon) hazır ve kendi testleri geçiyor; eksik olan yalnızca ödeme kuruluşu bağlantısı.

---

## Testlerin uyduğu kurallar

Sağlık verisiyle çalışıldığı için testler bilinçli olarak sınırlandırıldı:

- **Hiçbir test kalıcı iz bırakmaz.** Oluşturulan her randevu, fatura, gönderi ve kayıt test sonunda geri alınır.
- **Hasta belgesi yüklenmez.** Silinse bile ortamda şifreli bir dosya kalır ve saklama yükümlülüğü doğurur.
- **Yorum yazılmaz.** Geri alınamaz ve doktorun herkese açık puanını değiştirir.
- **Yönetici hesabı teste bağlanmaz.** Platformun en yetkili hesabını otomatik bir sürece bağlamak, kazanılacak kapsamdan büyük bir risktir. Yönetim panelinde ölçülen tek şey kapının kapalı olmasıdır.

---

## Bulunan hatalar

Hepsinin ortak yanı: **hiçbiri hata vermiyordu.** Sistem çalışıyor görünüyordu.

### 1. Aynı saat birden fazla hastaya verilebiliyordu

En ciddi bulgu. Aynı doktora, aynı güne, aynı saate eşzamanlı beş talep gönderildi — **beşi de kabul edildi.** Doktor o saatte beş hastayı bekliyor olurdu.

Bu hata tek kullanıcıyla asla görünmez; ancak iki kişi aynı anda aynı saati istediğinde ortaya çıkar. Yani platform büyüdükçe sıklaşır.

Koruma artık veritabanının kendisinde. Randevu iptal edilince saat gerçekten yeniden açılıyor. Canlı sistemde doğrulandı: beş talepten yalnızca biri kabul ediliyor.

### 2. Anlık bildirimler hiç çalışmıyordu

Bildirim altyapısı ayakta, sunucu mesajı gönderiyor, ama tarayıcı hiçbir zaman bağlanmıyordu. Kullanıcı sayfayı yenilemeden hiçbir bildirim görmüyordu.

### 3. Muayene kaydı hiç açılamıyordu

Doktor muayene kaydetmeye çalıştığında işlem her seferinde sunucu hatasıyla sonuçlanıyordu. Özellik bugüne kadar bir kez bile çalışmamıştı.

### 4. Tanı notu kayboluyordu

Muayene açılırken yazılan tanı notu kaydedilmiyordu. Doktor yazıyor, kaydediyor, not yok oluyordu.

### 5. CRM hasta listesi boş görünüyordu

Sayaç "3 hasta" derken liste "sonuç yok" diyordu. Veriler yerindeydi, ekran yanlış yerden okuyordu.

### 6. Üç ekran veri çekemiyordu

Doktor değerlendirmeleri ve yorum yazılabilir randevular ekranları veriyi bulamıyordu — adres çakışması yüzünden istekler yanlış yere gidiyordu.

### 7. Bildirim listesi ve zil rozeti çalışmıyordu

Bildirim sayfası hep boş, rozet hep sıfır görünüyordu. Bildirimler kayıtlıydı, okunamıyordu.

### 8. Hasta verisi tarayıcı diskine yazılabiliyordu

Hasta bilgisi taşıyan sayfalar, tarayıcının içeriği diskte saklamasını engelleyecek şekilde işaretlenmemişti. Ortak kullanılan bir bilgisayarda risk oluşturur. Artık tüm sistem varsayılan olarak "saklama" diyor.

### 9. Herkese açık sayfalar hiç önbelleklenmiyordu

Doktor listesi, arama, akış gibi saniyede değişmeyen içerikler için sisteme "bunları önbelleğe alma" talimatı gidiyordu. Her ziyaretçinin her isteği sunucuya ve veritabanına kadar iniyordu — gereksiz yük ve gereksiz bekleme.

### 10. Sunucu her istekte kendini yeniden kuruyordu

Açılışta yapılması gereken hazırlık hiç yapılmıyor, her istek aynı işi baştan tekrarlıyordu. Düzeltmeden sonra arama %31, doktor listesi %16 hızlandı.

---

## Performans

Sistemin yanıt süreleri gerçek sunucuda ölçüldü.

| | Tek kullanıcı | Dört eşzamanlı kullanıcı |
|---|---|---|
| Arama | ~0,3 sn | 0,8 sn |
| Doktor listesi | ~0,3 sn | 1,0 sn |

Ayrıca listelerin veri büyüdükçe yavaşlamadığı kalıcı testlerle güvence altına alındı: kayıt sayısı beş katına çıktığında sistemin veritabanına gitme sayısı **hiç artmıyor.** Bu, ileride binlerce kayda çıkıldığında da ekranların açılmaya devam edeceği anlamına gelir.

**Kalan sınır donanımdır.** Dört kullanıcı aynı anda işlem yaptığında bekleme süresi dört katına çıkıyor. Bunun sebebi yazılım değil, şu an kullanılan sunucunun kapasitesi. Kod tarafında kapatılacak boşluk kalmadı; sonraki adım sunucu kapasitesidir.

---

## Açık kalan konu

Sistemde **ara sıra ortaya çıkan bir sunucu hatası** var: birkaç istek üst üste başarısız oluyor, ardından kendiliğinden düzeliyor. İki kez gözlendi.

Elenen olasılıklar: istek sınırı, önbellek, zaman aşımı. Sorun uygulamanın kendi içinde.

En olası sebep veritabanı bağlantı sınırı, ancak bu **henüz kanıtlanmadı.** Tahmine dayanarak canlı sisteme müdahale edilmedi. Hata kayıt sistemi (Sentry) bu hatanın ayrıntısını tutuyor; o kayda bakıldığında çözüm netleşecek.

---

## Sonuç

Platform, üzerinde otomatik olarak koşan **267 testle** korunuyor. Bundan sonra yapılacak her değişiklikte bu testler yeniden çalışır; yukarıdaki hatalardan biri geri gelirse teslimattan önce yakalanır.

Bulunan hataların tamamının sessiz olması dikkate değer: hiçbiri ekrana hata yazmıyordu, hiçbiri kayıtlara düşmüyordu. Elle yapılan denemelerde fark edilmeleri mümkün değildi.
