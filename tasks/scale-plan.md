# MedaGama — Büyüme (Scale) Planı

**Amaç:** Kullanıcı arttıkça, hangi adımda ne yapacağımızı önceden görmek.
**İlke:** Her şeyi baştan kurmak yerine, ihtiyaç doğdukça adım adım ekleriz. Önce ucuz ve risksiz olanlar.

---

## Şu Anki Yapımız (başlangıç noktası)

| Parça | Durum |
|---|---|
| Ön yüz (site) | Modern, hızlı, dünya geneline dağıtılmış (CDN) |
| Arka uç (sunucu) | Sağlam, mevcut trafiği rahat kaldırıyor |
| Veritabanı | Bulut tabanlı, büyümeye hazır (dağıtık) |
| Hız/önbellek | Hazır (istenince açılır) |

**Kısaca:** Temel yapı büyümeye uygun. Acil bir eksik yok.

---

## KADEME 1 — ~1.000 Kullanıcı (Başlangıç)

**Durum:** Mevcut yapı fazlasıyla yeterli.

**Yapılacaklar (ucuz, risksiz):**
- Arka plan çalışma (Queue) aç → e-posta/bildirim/PDF kullanıcıyı bekletmez
- Önbellek (Redis) aç → aynı veri tekrar tekrar çekilmez, site hızlanır
- Mevcut sunucu ayarlarını iyileştir

**Yeni teknoloji gerekmez.** Var olanı düzgün kullanırız.

---

## KADEME 2 — ~10.000 Kullanıcı (Büyüme)

**Belirti:** Yoğun saatlerde site biraz yorulmaya başlar.

**Yapılacaklar:**
- **Sunucu kopyası artır** (2–3 kopya) → yük dağılır, tek noktaya yüklenmez
- **Arka plan işçileri** çoğalt → ağır işler hızlı biter
- **İzleme paneli** kur (hata + yavaşlık görünür olsun) → sorunu büyümeden yakalarız
- Sık açılan sayfaları önbellekten servis et

**Yeni eklenen:** Kopya artırma + izleme. Hâlâ düşük risk.

---

## KADEME 3 — ~100.000 Kullanıcı (Ölçek)

**Belirti:** Trafik sürekli yüksek, sunucu zorlanıyor.

**Yapılacaklar:**
- **Sunucu güçlendirme** (FrankenPHP/RoadRunner) → artık anlamlı; sunucu "hep hazır" çalışır
  - *Ön koşul:* sağlık verisi güvenlik denetimi
- **Veritabanı okuma kopyaları** → okuma yükü dağılır
- **Görseller/dosyalar ayrı depoya** (CDN) → sunucu hafifler
- **Güçlü arama altyapısı** → arama hızlanır
- **Bölgesel yayılım başlangıcı** → yurt dışı kullanıcıya yakın sunucu

**Yeni eklenen:** Güçlendirilmiş sunucu + arama + medya deposu.

---

## KADEME 4 — ~1.000.000 Kullanıcı (Büyük Ölçek)

**Belirti:** Dünya geneli yoğun kullanım.

**Yapılacaklar:**
- **Çok bölgeli yapı** → her kıtada sunucu + veritabanı, herkese yakın ve hızlı
- **Modülleri ayırma** → CRM, telehealth, ödeme gibi parçalar bağımsız ölçeklenir
- **Otomatik ölçekleme** → trafik artınca sistem kendi kendine büyür/küçülür
- **Gelişmiş izleme + güvenlik** (DDoS koruması dahil)

**Yeni eklenen:** Çok bölge + otomatik ölçekleme + modül ayrımı.

---

## Tek Bakışta Yol Haritası

| Kademe | Kullanıcı | Ana adım |
|---|---|---|
| 1 | ~1.000 | Önbellek + arka plan çalışma |
| 2 | ~10.000 | Kopya artır + izleme paneli |
| 3 | ~100.000 | Sunucu güçlendirme + arama + medya deposu |
| 4 | ~1.000.000 | Çok bölge + otomatik ölçekleme |

---

## 4 Temel İlke

1. **Önce ölç, sonra ekle** — tahminle değil, gerçek ihtiyaç görününce.
2. **Ucuz ve risksiz önce** — önbellek/arka plan/kopya; pahalı/riskli en son.
3. **Sağlık verisi güvenliği** — her adımda öncelik.
4. **Tek firmaya bağımlı kalma** — taşınabilir, standart teknolojiler.

---

## Özet

Sistem bugün sağlam ve büyümeye hazır. Kullanıcı arttıkça **sırayla**: önce önbellek ve arka plan çalışma, sonra kopya artırma, daha sonra (gerçekten gerekince) sunucu güçlendirme, en sonunda çok bölgeli yapı. Her adım, bir öncekinin üstüne; sıçramadan, ihtiyaca göre.
