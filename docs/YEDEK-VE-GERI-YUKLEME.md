# Yedek ve Geri Yükleme

Bu yordam bir felaket anında **hasta verisini geri getirmek** için var. O anda
kimse belge okuyup düşünmek istemez; buradaki adımlar sırayla uygulanacak
şekilde yazıldı.

---

## Günlük yedek

Zamanlayıcı her gece **04:10**'da alıyor:

```bash
php artisan db:yedek
```

Saat rastgele değil: budama işleri 03:00–03:40 arasında koşuyor ve yedek
onlardan **sonra** alınıyor. Tersi olsaydı, o gece silinmesi gereken kayıtlar
yedekte yaşamaya devam ederdi — "silindi" dediğimiz veri aslında durur ve
saklama politikası kâğıt üstünde kalırdı.

Varsayılan olarak 7 günlük yedek tutuluyor (`--tut=7`).

---

## ⚠️ Yedeğin sunucu dışına çıkması

Komut, hedef yerel diskse **uyarır** — ve bu uyarı ciddiye alınmalı.

Render gibi ortamlarda disk geçicidir: kapsayıcı yeniden başladığında dosya
gider. Daha önemlisi, **aynı makinede duran bir yedek, o makineyi kaybettiren
bir arızada hiçbir işe yaramaz.** Yedeğin tek anlamı, kaybedilen şeyden ayrı
bir yerde durmasıdır.

Sunucu dışına taşımak için:

```env
YEDEK_DISK=s3
```

Bu bir altyapı kararıdır (S3 kovası, kimlik bilgileri, bölge) ve yazılım
tarafında değil, hesap tarafında yapılır. **Bu yapılana kadar sistemin
kullanılabilir bir yedeği yoktur.**

---

## Yedeğin gerçekten işe yaradığını doğrulama

```bash
php artisan db:yedek --dogrula
```

Ne yapıyor:

1. Yedeği alıyor
2. **Geçici bir veritabanına geri yüklüyor**
3. Tablo sayılarını ve satır sayılarını kaynakla karşılaştırıyor
4. Geçici veritabanını siliyor

Beklenen çıktı:

```
Prova başarılı: 78 tablo, 6.445 satır geri yüklendi.
```

### Bunun neden ayrı bir adım olduğu

İlk provada tam olarak şu oldu: yedek sorunsuz alındı, doğru boyuttaydı,
hiçbir hata vermedi — **ve geri yüklenemedi.** Sebep `mysqldump`'ın çıktıya
koyduğu bir GTID satırıydı; sunucu dökümü kabul etmiyordu.

Prova olmasaydı bu, felaket anına kadar bilinmezdi. **Alınmış ama hiç geri
yüklenmemiş bir yedek, yedek sayılmaz; yedek olduğu sanılan bir dosyadır.**

Bu yüzden prova ayda en az bir kez elle koşturulmalı.

> Prova **üretimde çalışmaz** — veritabanı oluşturup silmek üretim kimlik
> bilgileriyle yapılacak bir iş değil. Canlının kopyası olan bir ortamda koşar.

---

## Felaket anı: geri yükleme

**1. Önce durdur.** Uygulama yazmaya devam ederken geri yükleme yapılmaz;
yarı eski yarı yeni bir veritabanı, kayıp veriden daha kötüdür.

**2. Yedeği bul.** Hangi ana dönüleceğine karar ver — dosya adı zaman damgası
taşıyor: `medagama-2026-08-27-041000.sql`

**3. Mevcut veritabanını ÜZERİNE YAZMA.** Yeni bir veritabanına yükle:

```bash
mysql -h <host> -u <user> -p -e "CREATE DATABASE medagama_kurtarma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -h <host> -u <user> -p medagama_kurtarma < medagama-2026-08-27-041000.sql
```

Bozuk olanı silmeden önce yenisinin sağlam olduğunu görmek gerekir.

**4. Doğrula.** En azından şunlara bak:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM appointments;
SELECT COUNT(*) FROM invoices;
SELECT MAX(created_at) FROM appointments;   -- veri nereye kadar geliyor
```

Son satır önemli: yedeğin hangi ana kadar veri taşıdığını gösterir. O andan
sonraki her şey kayıptır ve bunun ne kadar olduğunu bilmek gerekir.

**5. Uygulamayı yeni veritabanına çevir** (`DB_DATABASE`), sonra aç.

**6. Kaybı kayda geç.** Yedek ile arıza anı arasındaki veri gitti. Etkilenen
randevu ve fatura kayıtları belirlenmeli — ve KVKK/GDPR açısından veri kaybı
bir ihlal bildirimi gerektirebilir. Süreç `docs/SECURITY_INCIDENT_RUNBOOK.md`
içinde.

---

## Bu yordamın kapsamadıkları

| | |
|---|---|
| **Dosyalar** | Hasta belgeleri ve sohbet ekleri veritabanında DEĞİL, diskte şifreli duruyor. Bu yedek onları kapsamaz; dosya deposunun ayrı yedeği gerekir. |
| **Sunucu dışına taşıma** | `YEDEK_DISK` ayarlanana kadar yedekler aynı makinede. |
| **Otomatik prova** | Zamanlanmış iş yalnız yedek alıyor; `--dogrula` elle koşuluyor. |
