# Medagama - Altyapı Özeti

8 Eylül 2026

Medagama'nın çalıştığı hizmetler, ne için kullanıldıkları ve nerede
oldukları. Şifre ve anahtar içermez.

| # | Hizmet | Ne için | Nerede / adres |
|----|--------------------|----------------------------------------|----------------------------------|
| 1 | Vercel | Web sitesi (arayüz) | https://med-gama.vercel.app |
| 2 | Render | Uygulama sunucusu (API), Docker | https://medagama-backend.onrender.com |
| 3 | TiDB Cloud | Veritabanı (MySQL uyumlu): kullanıcılar, randevular, faturalar, mesajlar. Otomatik yedekleme | Avrupa (Frankfurt) |
| 4 | OVH sunucu | Görüntülü görüşme sinyali ve TURN, canlı alt yazı (Whisper), çeviri (LibreTranslate) | Strasbourg (Fransa); 4 çekirdek, 15 GB RAM, 96 GB disk |
| 5 | GitHub | Kaynak kod deposu | https://github.com/Cross4solution/Medagama |
| 6 | Sentry | Hata izleme | - |

## Nasıl çalışıyor

- Kod GitHub'a gönderildiğinde Vercel (arayüz) ve Render (API) otomatik
  olarak yeniden yayınlar.
- Görüşme, alt yazı ve çeviri tamamen kendi sunucumuzda (OVH) çalışır;
  hasta verisi üçüncü tarafa gitmez.
- Hasta dosyaları uygulama sunucusunun diskinde şifreli tutulur. Bulut
  depolamaya taşıma, Müşteri adına açılacak hesapla yapılacaktır.

## Alan adı ve e-posta

Henüz alan adı bağlı değil; site geçici Vercel adresinde çalışıyor. Alan adı
alındığında site, sertifikalar ve e-posta gönderimi ona taşınacak. Bugün
kayıt ve şifre sıfırlama e-postaları bu yüzden gönderilemiyor.

## Hesaplar

Tüm hesaplar bugün Geliştirici adınadır. Müşteri kendi hesaplarını açtığında
kod, veritabanı yedeği, hasta dosyaları ve ayarlar taşınır (teslim tutanağı
Bölüm 5).
