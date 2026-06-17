# MedaGama — Büyüme ve Hız Planı

**Soru:** Kullanıcı arttıkça siteyi hızlı tutmak için neyi, ne zaman yapmalıyız?
**Cevap:** Her adımın net bir "ne zaman" işareti var. Tahminle değil, ihtiyaç doğunca yaparız.

---

## Önce İki Farklı Şeyi Ayıralım

Sık karıştırılır ama ayrı işler:

**1. Arka planda çalışma (Queue)**
Benzetme: Lokantada garson siparişi alır, mutfağa iletir, **sen yemeği beklerken garson başka masalara bakar.** Yani yavaş işler (e-posta, PDF, bildirim) arka planda yapılır, kullanıcı beklemez.
→ Her boyutta faydalı. **Şimdi açılabilir, risk yok.**

**2. Sunucuyu güçlendirme (RoadRunner vb.)**
Benzetme: Lokantanın **mutfağını büyütmek / daha hızlı ocak almak.** Çok yoğunlukta gerekir.
→ Sadece **çok yüksek trafikte** mantıklı.

Bunlar birbirinin yerine geçmez. Birincisi "garsonu akıllı kullan", ikincisi "mutfağı büyüt."

---

## Ne Zaman Ne Yapmalı? (basit işaretler)

Aşağıdaki işaret görülmeden o adıma geçilmez:

| İşaret (ne görürsek) | Ne yaparız | Zorluk |
|---|---|---|
| E-posta/PDF yüzünden kullanıcı bekliyor | Arka plan çalışmayı aç (Queue) | Kolay, risksiz |
| Site yavaşlamaya başladı, sunucu yoruluyor | Sunucu kopyasını artır (2-3 kopya) | Kolay |
| Sunucu dolu ama işlemci boş | Ayarları iyileştir (ince ayar) | Kolay, risksiz |
| Aynı veriler tekrar tekrar çekiliyor | Hafıza/önbellek ekle (Redis) | Kolay |
| Yukarıdakiler YETMEDİ, hâlâ yavaş | Sunucuyu güçlendir (RoadRunner/FrankenPHP) | Zor, hazırlık ister |
| Farklı ülkelerden yavaş açılıyor | Sunucuyu o bölgelere de koy | Orta |

**Mantık:** Önce ucuz ve risksiz çözümler. Onlar yetmezse, en son sunucuyu güçlendir.

---

## Sunucu Güçlendirme Seçenekleri (en son adım için)

Hepsi aynı işi yapar: sunucuyu "her seferinde sıfırdan kurmak" yerine "hep hazır" tutar.

| Seçenek | Hız | Kurulum | Notu |
|---|---|---|---|
| Mevcut (ince ayar) | İyi | Yok | İlk denenecek, risksiz |
| **FrankenPHP** | Çok hızlı | Kolay | **Önerilen** — modern, basit |
| RoadRunner | Çok hızlı | Orta | Sağlam, dengeli |
| Swoole | En hızlı | Zor | Sadece aşırı yükte |

---

## Kanıt — Gerçek Ölçüm

MedaGama'nın kendi sistemi üzerinde test ettik:

| | Şu anki (her istekte hazırlık) | Güçlendirilmiş (hep hazır) |
|---|---|---|
| Bir işlemin hazırlık süresi | ~6 ms | neredeyse 0 |

**Dürüst not:** Bu test sadece "hazırlık" kısmını ölçer. Gerçekte bir sayfa açılırken veri tabanı + işlem de var, onlar iki sistemde de aynı. Yani gerçek kazanç:

| Sayfa tipi | Hız kazancı |
|---|---|
| Hafif sayfa (hızlı veri) | ~%40 daha hızlı |
| Orta sayfa | ~%15 |
| Ağır sayfa (rapor) | ~%5 |

**Özet:** Güçlendirme gerçekten hızlandırır ama asıl faydayı **çok sayıda hafif ve sık açılan sayfa** olunca verir. Yani trafik gerçekten büyüyünce.

---

## Maliyet ve Risk

| Adım | Maliyet | Risk |
|---|---|---|
| Arka plan çalışma (Queue) | Düşük | Yok |
| Sunucu kopyası artır | Orta | Düşük |
| İnce ayar | Yok | Yok |
| Sunucu güçlendirme (RoadRunner) | Orta | Dikkat ister (aşağıda) |
| Bölgesel yayılım | Yüksek | Orta |

---

## Önemli — Sağlık Verisi Uyarısı
Sunucu güçlendirme (RoadRunner/Octane) sistemi "hep hafızada açık" tutar. Yanlış yapılırsa **bir hastanın bilgisi başka bir kullanıcıya karışabilir.** Bu yüzden geçiş öncesi güvenlik denetimi ZORUNLU — "1-2 hafta hazırlık" gereğinin asıl sebebi budur.

---

## Sade Yol Haritası

```
ŞİMDİ              → Arka plan çalışmayı aç (risksiz, gerçek ihtiyaç)
Site yavaşlarsa    → Kopya artır + ince ayar + önbellek
Bunlar yetmezse    → Sunucuyu güçlendir (FrankenPHP) + güvenlik denetimi
Global olunca      → Bölgesel yayılım
```

**Tek cümleyle:** Her adımın net bir işareti var. Sunucu güçlendirmeye, ucuz çözümler yetmediği ve site gerçekten zorlandığı an geçeriz. Erken geçiş, ihtiyaç yokken para ve risktir.
