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
| 5 | Sentry | Hata izleme | - |

## OVH sunucu erişimi

| | |
|----------------------|--------------------------------------|
| Sağlayıcı / model | OVH, b3-16 (Strasbourg, SBG7) |
| İşletim sistemi | Ubuntu 24.04 |
| IPv4 | 57.128.27.244 |
| IPv6 | 2001:41d0:404:400::3f |
| Geçici adres (TLS) | https://57-128-27-244.sslip.io |
| SSH kullanıcısı | ubuntu |
| Kimlik doğrulama | SSH anahtarı (`medagama_deploy`); şifreyle giriş kapalı |
| Bağlantı | `ssh -i medagama_deploy ubuntu@57.128.27.244` |
| Üzerinde çalışanlar | soketi (görüşme sinyali), coturn (TURN), medagama-stt (alt yazı), libretranslate (çeviri); hepsi Docker |
| Gizli ayarlar | Sunucuda `/etc/medagama/stt.env` |
