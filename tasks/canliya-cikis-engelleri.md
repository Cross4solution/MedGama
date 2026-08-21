# Canlıya Çıkış Engelleri

Test sırasında bulunan, **kodla çözülemeyen** işler. Hepsi bir hesap, bir alan
adı ya da bir panel ayarı bekliyor. Kod tarafı hazır olduğunda buraya işlenir.

Son güncelleme: 21 Ağustos 2026

---

## 1. E-posta gönderimi çalışmıyor — ALAN ADI BEKLİYOR

**Durum:** Sistem hiç kimseye e-posta gönderemiyor. Tek istisna
`project.dev.std@gmail.com` (Resend hesabının kendi adresi).

**Kanıt** (`/api/system/mail-preview` çıktısı):

> Request to the Resend API failed. Reason: You can only send testing emails to
> your own email address (project.dev.std@gmail.com). To send emails to other
> recipients, please verify a domain at resend.com/domains

**Etkisi — 19 şablonun hepsi ölü:**
- Şifre sıfırlama → kimse şifresini sıfırlayamaz
- E-posta doğrulama → **hasta ve doktor kaydı tamamlanamaz**
- Randevu bildirimleri, fatura, destek yanıtları → gitmiyor

**Neden fark edilmedi:** Şifre sıfırlama, adres sayımını engellemek için
başarısızlıkta da aynı yanıtı veriyor. Ekran "kod gönderildi" diyor, gönderim
tamamen ölü olsa bile. Güvenlik kararı doğru; yan etkisi teşhisi zorlaştırıyor.

**Yapılacak (müşteri alan adını alınca):**
1. resend.com/domains → alan adını ekle, DNS kayıtlarını gir
2. Render → `MAIL_FROM_ADDRESS` = `noreply@<alanadi>`
3. Yeniden dağıt
4. Doğrula: `/api/system/mail-preview?key=<INIT_DB_KEY>&to=<baska-bir-adres>`
   → hepsi `gonderildi` demeli

---

## 2. Yönetim panelinin 13 ekranı test edilmedi — YETKİLİ OTURUM YOK

**Durum:** Panelin hiçbir ekranı canlıda görülmedi. Mevcut testler yalnızca
"kimler giremez" tarafını kapsıyor.

**Neden:** Şifresiz demo girişi (doğru şekilde) kapatıldı; yönetici hesabının
parolası bilinmiyor ve e-posta çalışmadığı için sıfırlanamıyor. Yani (1)'e
bağlı.

**Yapılacak:** E-posta düzelince yönetici parolası sıfırlanır, sonra:

```bash
E2E_ADMIN_EMAIL='...' E2E_ADMIN_PASSWORD='...' \
  npx playwright test tests/e2e/genis-tarama.spec.js -g "yonetici"
```

Oturum `tests/e2e/.oturum/yonetici.json` içine yazılır (git'e girmez).

---

## 3. Doktor ve klinik tarafı canlıda test edilemiyor

**Durum:** `demoDoktor` ve `demoKlinik` oturumları artık alınamıyor — şifresiz
demo girişinden geliyorlardı, o kapı kapatıldı.

**Etkisi:** 14 test dosyası bu oturumlara bağlı (CRM ekranları, faturalar,
muayene, yetki sınırları, mesajlaşma, geniş tarama). Şu an yalnızca hasta
oturumu ayakta.

**Yapılacak:** Yöneticide olduğu gibi, gerçek bir doktor ve klinik hesabının
bilgileri ortam değişkeniyle verilir. `tests/e2e/kurulum.js` aynı kalıbı
destekleyecek şekilde genişletilmeli.

---

## 4. Teslimden önce kapatılacak / silinecek

| Ne | Nerede | Neden |
|---|---|---|
| `TIMING_HEADER` | Render ortam değişkeni | Veritabanı sürelerini her yanıtta dışarı veriyor |
| `/api/system/mail-preview` | `routes/api.php` + controller | Anahtarı bilen herkes sunucudan istediği adrese e-posta gönderebilir |
| CSP izleme modu | `next.config.js` | Şu an hiçbir şeyi engellemiyor, yalnızca rapor ediyor. Birkaç günlük gerçek trafik sonrası engelleyici moda alınmalı |
| `SEED_VITRIN` | Render ortam değişkeni | Vitrin verisi yüklendikten sonra kaldırılabilir (zararsız ama her açılışta gereksiz yazma) |

**Not — `mail-preview` hakkında ayrı bir kusur:** Gönderdiği örnek e-postalar
gerçeğinden ayırt edilemiyor; "bu bir testtir" damgası yok. Test sırasında
"Hesabınızın şifresi değiştirildi" e-postası alan kişi hesabının ele
geçirildiğini sanıyor — bu yaşandı. Uç silinmezse en azından konu satırına
damga eklenmeli.

---

## 5. Ödeme akışı test edilemiyor — SAĞLAYICI SEÇİLMEDİ

`app/Payments/PaymentProvider.php` bir taslak; kodun kendi notu:

> *"Sağlayıcı henüz seçilmedi (iyzico / Stripe / PayTR)."*

`AppServiceProvider` içinde bağlama satırı yorumda bekliyor.

Fatura kesme, tahsilat kaydı ve bakiye tarafı çalışıyor ve test edildi — eksik
olan yalnızca **gerçek para hareketi**. Kart tahsilatı, iade, 3D Secure ve
webhook doğrulaması sağlayıcı seçilmeden yazılamaz ve test edilemez.

**Yapılacak:** Müşteri sağlayıcıyı seçtiğinde entegrasyon + testler yazılır.
Seçim Türkiye ağırlıklıysa iyzico/PayTR, yurt dışı hasta hedefleniyorsa Stripe
daha uygun — bu bir iş kararı.

---

## 6. Yasal sayfaların çevirisi — MÜŞTERİ KARARI

`Kullanım Koşulları`, `Gizlilik Politikası`, `Çerez Politikası` ve
`Veri Hakları` sayfalarında 72 metin çevrilmemiş; hepsi İngilizce duruyor.

Bilerek dokunulmadı: sözleşme metnini çevirmek hukuki sonuç doğurur, yazılım
kararı değil. Metinlerin sahibinden onay gelmeden çevrilmemeli.
