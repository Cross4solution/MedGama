# MedaGama — RoadRunner: Şimdi Gerekli mi? Ne Zaman Gerekir?

**Kısa cevap:** Şu an gerekli DEĞİL. Çok yüksek trafikte (yaklaşık 100.000+ aktif kullanıcı) gündeme gelir.

---

## 1. RoadRunner Nedir? (tek cümle)

Sunucuyu "her istekte sıfırdan kurmak" yerine "hep hazır" tutan bir teknolojidir. Yani siteyi yüksek trafikte daha hızlı yapar.

Benzetme: Lokantanın mutfağını her sipariş için baştan kurmak yerine, mutfağı hep açık tutmak.

---

## 2. Alternatifleri (aynı işi yapan teknolojiler)

Hepsi "sunucuyu hep hazır tut" mantığıyla çalışır:

| Teknoloji | Hız | Kurulum | Açıklama |
|---|---|---|---|
| **Mevcut yapımız (php-fpm)** | İyi | — | Şu an bunu kullanıyoruz, yeterli |
| **FrankenPHP** | Çok hızlı | Kolay | En modern, önerilen ilk seçenek |
| **RoadRunner** | Çok hızlı | Orta | Sağlam, olgun |
| **Swoole** | En hızlı | Zor | Sadece aşırı yükte gerekir |

Not: FrankenPHP, RoadRunner ve Swoole aynı amaca hizmet eder. Birini seçmek yeterli.

---

## 3. Neden Şu An Gerekli DEĞİL? (ispat)

### a) Mevcut yapı trafiği fazlasıyla kaldırıyor
Şu anki php-fpm yapısı düşük–orta trafikte sorunsuz çalışır. Darboğaz yok.

### b) Ölçtük — kazanç şu an anlamsız
MedaGama'nın kendi sistemini test ettik:
- Sunucu güçlendirme sadece "hazırlık süresini" (~6 milisaniye) kısaltır.
- Ama bir sayfa açılırken asıl zaman veritabanı + işlemde geçer — bu, güçlendirmeyle DEĞİŞMEZ.
- Yani düşük trafikte kullanıcı hiçbir fark hissetmez.

| Sayfa tipi | Güçlendirmeyle kazanç |
|---|---|
| Hafif sayfa | ~%40 daha hızlı |
| Orta sayfa | ~%15 |
| Ağır sayfa | ~%5 |

Bu kazanç ancak **saniyede yüzlerce-binlerce istek** olunca değer kazanır. Düşük trafikte fark edilmez.

### c) Asıl ihtiyaç farklı bir şey
Kullanıcıyı bekleten şey genelde "yan işler" (e-posta, PDF, bildirim). Bunun çözümü RoadRunner değil, **arka plan çalışma (Queue)** — ki bunu istediğimiz an açabiliriz, risksiz.

### d) Sağlık verisi riski
RoadRunner sistemi "hep hafızada açık" tutar. Yanlış kurulursa bir hastanın bilgisi başka kullanıcıya karışabilir. Bu yüzden erken geçiş gereksiz risktir.

---

## 4. Ne Zaman Gerekir? (eşikler)

| Aşama | Aktif kullanıcı | Trafik | RoadRunner gerekir mi? |
|---|---|---|---|
| Başlangıç | ~1.000 | Düşük | ❌ Hayır — mevcut yapı yeter |
| Büyüme | ~10.000 | Orta | ❌ Hayır — önce kopya artır + önbellek + Queue |
| Ölçek | ~100.000 | Yüksek (saniyede yüzlerce istek) | ⚠️ Belki — ucuz çözümler yetmezse |
| Kurumsal | ~1.000.000 | Çok yüksek | ✅ Evet — gündeme gelir |

**Net işaret:** Sunucu sürekli yoruluyor (işlemci %70+), sayfalar yavaşlıyor VE kopya artırma + ince ayar + önbellek + Queue çözmüyorsa → işte o zaman RoadRunner/FrankenPHP mantıklı.

---

## 5. O Güne Kadar Ne Yapılır? (RoadRunner yerine, sırayla)

Ucuzdan pahalıya, risksizden risklere:

1. **Arka plan çalışma (Queue)** — yan işleri kullanıcıdan ayır (şimdi yapılabilir)
2. **Önbellek (Redis)** — aynı veriyi tekrar çekme
3. **İnce ayar** — mevcut sunucu ayarlarını iyileştir
4. **Kopya artırma** — 2-3 sunucu kopyası
5. **(En son) Sunucu güçlendirme** — FrankenPHP/RoadRunner

Genelde ilk 4 adım, RoadRunner'a gerek kalmadan rahatlatır.

---

## 6. Özet

- **Şimdi:** RoadRunner'a gerek yok. Mevcut yapı yeterli.
- **Asıl ihtiyaç:** "arka plan çalışma" (Queue) — istenirse hemen açılır.
- **RoadRunner zamanı:** ~100.000+ aktif kullanıcı ve sürekli yüksek trafik; ucuz çözümler yetmediğinde.
- **O zaman bile:** önce FrankenPHP (daha kolay), sağlık verisi güvenlik denetimiyle.

**Kanıt:** Test bu projenin kendi sisteminde yapıldı, tekrarlanabilir.
