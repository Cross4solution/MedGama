# Müşteriye yönetim paneli erişimi

Müşteri paneli gezebilsin, ama hiçbir şeyi bozamasın.

---

## Neden şifresiz açmadık

İlk düşünülen yol `/admin`'i şifresiz açmaktı. Yapılmadı, çünkü:

- Panel hasta kayıtlarına, faturalara ve kullanıcı yönetimine bakıyor.
- Adres gizli kalmaz: tarayıcı geçmişi, ekran görüntüsü, iletilen bir mesaj,
  arama motoru — hepsi sızdırır. "Sadece ona göndereceğim" bir erişim
  denetimi değil.
- Sağlık verisi olduğu için KVKK açısından da savunulamaz.

Tam yetkili bir hesap vermek de risk taşıyordu: tanıtım sırasında yanlışlıkla
silinen bir hasta kaydı geri gelmiyor.

Seçilen yol: **süresiz, ama yalnızca görüntüleyebilen** bir yönetici hesabı.

---

## Hesabı açma

Render → servis → **Shell**:

```bash
php artisan yonetici:olustur musteri@alanadi.com --salt-okunur
```

Şifreyi komut **size sorar** ve ekranda göstermez. Komut satırına yazılmıyor;
yoksa Render'ın komut günlüğüne ve sunucudaki süreç listesine düz metin olarak
düşerdi.

Şifre kayıt akışıyla aynı ölçüde güçlü olmalı: en az 8 karakter, büyük ve
küçük harf, rakam, simge. Zayıf şifre reddedilir.

Sonra müşteriye iletirsiniz:

| | |
|---|---|
| Adres | `https://<alan-adı>/tr/admin` |
| E-posta | komutta yazdığınız adres |
| Şifre | sizin belirlediğiniz |

Süre sınırı yok; istediği zaman girer.

---

## Hesap ne yapabilir, ne yapamaz

**Yapabilir:** bütün ekranları açar, listeleri, sayıları, raporları görür.

**Yapamaz:** hiçbir ekleme, değiştirme, silme. Kısıt yöntem düzeyinde
(`GET` geçer, `POST/PUT/PATCH/DELETE` 403 döner) ve uçlara tek tek değil
`api` yığınının tamamına bağlı — yarın eklenen bir uç da kendiliğinden
korunuyor.

Panelde üstte turuncu bir şerit çıkıyor: *"Görüntüleme hesabı."* Bu olmasa
müşteri düğmelere basar, hata alır ve panelin bozuk olduğunu sanırdı.

Kısıt kullanıcının kendi elinde değil: `salt_okunur` alanı toplu atamaya
kapalı, yani profil güncelleme isteğine eklenerek kaldırılamıyor.

---

## Sonradan

**Tam yetki vermek:** aynı komutu `--salt-okunur` olmadan çalıştırın; hesap
tam yönetici olur ve şifresi yenilenir.

**Şifreyi unuttular:** aynı komut şifreyi yeniler. Şu an tek yol bu —
"şifremi unuttum" e-postası **çalışmıyor**, çünkü alan adı alınmadığı için
sistem hiç e-posta gönderemiyor.

**Erişimi kapatmak:** hesabı silin ya da şifresini değiştirin.

---

## Tohumdaki hesap neden işe yaramıyor

`admin@medagama.com / Password123!` `DatabaseSeeder` içinde ve canlı dağıtım
onu **çalıştırmıyor** — kapsayıcı yalnız `VitrinSeeder`'ı koşuyor. O yüzden
canlıda böyle bir hesap yok; denenirse "e-posta veya şifre hatalı" der.

Tam tohumlamayı canlıda çalıştırmak da çözüm değil: demo hastaları, demo
hekimleri ve herkesçe bilinen bir şifreyi üretim veritabanına yazar.
