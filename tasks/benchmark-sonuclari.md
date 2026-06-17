# MedaGama — Performans Testi ve RoadRunner Etki Analizi

**Amaç:** Mevcut sistemin gerçek hızını ölçmek ve RoadRunner kurulsa şu an anlamlı bir değişiklik OLMAYACAĞINI kanıtlamak.
**Yöntem:** Canlı sistem (medagama-backend.onrender.com) üzerinde gerçek sayfa/istek ölçümü — sadece okuma, hafif test.

---

## 1. Test Nasıl Yapıldı?

- Canlı sistemin gerçek API uçları ölçüldü (sağlık kontrolü, uzmanlık listesi, doktor listesi, klinik listesi).
- Her uç için ilk ısınma istekleri sayılmadı (cold-start hariç) → **aktif kullanım anındaki gerçek hız**.
- Her uç 15 kez ardışık çağrıldı, ortalama ve dağılım alındı.

---

## 2. Mevcut Sistem Performansı (gerçek ölçüm)

| Sayfa / İstek | Ortalama süre | En hızlı | En yavaş |
|---|---|---|---|
| Sağlık kontrolü | 107 ms | 66 ms | 199 ms |
| Uzmanlık listesi | 127 ms | 84 ms | 200 ms |
| Doktor listesi | 341 ms | 204 ms | 420 ms |
| Klinik listesi | 275 ms | 183 ms | 404 ms |

**Yorum:** Sistem mevcut trafikte sorunsuz yanıt veriyor. Sürelerin çoğu veritabanı sorgusu + ağ gecikmesinden geliyor (sunucu Frankfurt + veritabanı bulut). Bu süreler RoadRunner ile DEĞİŞMEZ.

---

## 3. RoadRunner Kurulsa Ne Değişirdi?

RoadRunner yalnızca "framework hazırlık süresini" (~6 ms) ortadan kaldırır. Bu süre, gerçek sayfa süresinin içinde ne kadar yer kaplıyor?

| Sayfa / İstek | Toplam süre | RoadRunner'ın kaldıracağı pay | Kazanç |
|---|---|---|---|
| Sağlık kontrolü | 107 ms | 6 ms | **%5.6** |
| Uzmanlık listesi | 127 ms | 6 ms | **%4.7** |
| Doktor listesi | 341 ms | 6 ms | **%1.8** |
| Klinik listesi | 275 ms | 6 ms | **%2.2** |

**Sonuç:** RoadRunner mevcut sistemde sayfaları yalnızca **%2–6** hızlandırırdı — yani **kullanıcının fark edemeyeceği** bir miktar (örn. 341 ms → 335 ms). Geri kalan %94–98'lik süre (veritabanı + ağ) RoadRunner ile aynı kalır.

---

## 4. Neden Şu An Anlamsız?

- **Kazanç hissedilmez:** 6 ms, 100–340 ms'lik sürelerin yanında görünmez.
- **Asıl yavaşlık başka yerde:** Veritabanı + ağ. Onu hızlandırmak için önbellek (Redis) ve sorgu iyileştirmesi gerekir — RoadRunner değil.
- **Risk getirir:** Sağlık verisinde "hep açık bellek" yanlış kurulursa hasta bilgisi karışabilir.
- **Maliyet + emek:** Kurulum + güvenlik denetimi 1–2 hafta; karşılığında %2–6 (görünmez) kazanç.

---

## 5. RoadRunner Ne Zaman Anlam Kazanır?

RoadRunner'ın ~6 ms tasarrufu ancak şu olunca değerlenir:

- **Saniyede yüzlerce-binlerce istek** olduğunda (yüksek trafik),
- İstekler hafif + sık olduğunda (örn. çok sayıda önbellekli API çağrısı),
- Mevcut sunucu kapasitesi (php-fpm) dolup CPU yandığında.

Kabaca: **~100.000+ aktif kullanıcı** ve sürekli yoğun trafik. O noktaya kadar mevcut yapı + ucuz iyileştirmeler (önbellek, kopya artırma, arka plan çalışma) yeterlidir.

---

## 6. Özet

| Soru | Cevap |
|---|---|
| Mevcut sistem yeterli mi? | ✅ Evet, gerçek ölçümle sorunsuz |
| RoadRunner şu an fark yaratır mı? | ❌ Hayır — sadece %2–6, hissedilmez |
| Asıl yavaşlık nerede? | Veritabanı + ağ (RoadRunner çözmez) |
| Ne zaman gerekir? | ~100.000+ kullanıcı, sürekli yüksek trafik |
| O zamana kadar? | Önbellek + kopya + arka plan çalışma yeterli |

**Tek cümle:** Ölçtük — RoadRunner mevcut sistemde sayfaları yalnızca %2–6 (görünmez ölçüde) hızlandırır; asıl süre veritabanı ve ağda geçer. Yüksek trafiğe ulaşana kadar gereksiz maliyet ve risktir.

---

## 7. Tekrarlanabilirlik
Bu ölçüm canlı sistemde yapıldı, tekrar edilebilir. Framework hazırlık süresi (~6 ms) projenin kendi Laravel'inde ölçüldü: `php tasks/bench/roadrunner_bench.php`.
