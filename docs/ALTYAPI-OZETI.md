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
