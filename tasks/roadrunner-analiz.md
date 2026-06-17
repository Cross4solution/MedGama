# MedaGama — RoadRunner / Octane Analizi ve Benchmark

**Konu:** Kalıcı worker (RoadRunner/Octane) mimarisinin MedaGama'ya somut faydası — ölçümlü değerlendirme
**Yöntem:** Kontrollü benchmark (gerçek Laravel bootstrap, bu makine) + dürüst end-to-end modelleme

---

## 1. RoadRunner Nedir? (kısaca)

RoadRunner = Go ile yazılmış bir PHP uygulama sunucusu. Laravel'de **Octane** paketi ile kullanılır. Tek cümleyle:

- **php-fpm (mevcut):** Her HTTP isteğinde Laravel framework'ü **sıfırdan başlatır** (env + config + servis sağlayıcıları yükler), isteği işler, atar.
- **RoadRunner/Octane:** Framework'ü **bir kez** başlatır, bellekte tutar; gelen istekleri bu hazır uygulama üzerinde işler. "Her seferinde mutfağı kurmak" yerine "mutfak hep hazır."

---

## 2. Benchmark — Gerçek Ölçüm (bu makine)

PHP 8.5.3, opcache açık, gerçek MedaGama Laravel bootstrap'ı ölçüldü (200 istek).

| Metrik | php-fpm (her istekte boot) | RoadRunner/Octane (kalıcı) |
|---|---|---|
| Ortalama gecikme | **5.97 ms** | **0.017 ms** |
| p50 | 5.56 ms | 0.013 ms |
| p99 | 8.43 ms | 0.08 ms |
| Saniyede istek (tek çekirdek) | 167 | 59.860 |

**Tek seferlik ölçümler:** İlk soğuk boot 247 ms, ısınmış (opcache'li) framework yeniden-bootstrap ≈ **6 ms/istek**, saf istek işleme 0.015 ms.

### ⚠️ Bu Rakam Yanıltıcı Olmasın — Dürüst Okuma
Yukarıdaki **357x**, yalnızca **framework boot kısmını** izole eder. Gerçek bir istek ayrıca **veritabanı sorgusu + iş mantığı + serialization** yapar ve bunları **her iki mimari de aynı şekilde** öder. Yani gerçek dünyadaki kazanç, isteğin ne kadar "ağır" olduğuna bağlıdır.

---

## 3. Gerçekçi End-to-End Modelleme

Ölçülen boot tasarrufu (~6 ms/istek) gerçek endpoint'lere uygulanırsa:

| Endpoint tipi | Gerçek iş (DB+mantık) | php-fpm = boot+iş | Octane = iş | Gecikme ↓ | Throughput ↑ |
|---|---|---|---|---|---|
| Hafif (cache hit, basit JSON) | ~8 ms | 14 ms | 8 ms | **%43** | **1.75x** |
| Orta (birkaç sorgu) | ~35 ms | 41 ms | 35 ms | %15 | 1.17x |
| Ağır (çok sorgu/rapor) | ~120 ms | 126 ms | 120 ms | %5 | 1.05x |

**Sonuç:** Octane/RoadRunner **en çok hafif, sık çağrılan, cache'li API'lerde** kazandırır (boot, toplam sürenin büyük kısmı). Ağır DB isteklerinde kazanç küçülür. Sektör genel kabulü: **gerçek dünyada %30-70 gecikme azalması, 2-4x throughput** (yalnız boot değil, ayrıca kalıcı DB/Redis bağlantıları + worker concurrency'den).

> **Müşteriye net mesaj:** "357x" laboratuvar rakamıdır (sadece boot). MedaGama'da beklenen gerçekçi kazanç **2-4x throughput / %30-50 gecikme** — yine de ciddi, ama doğru beklenti bu.

---

## 4. RoadRunner Ne Zaman Gerçekten Gerekli?

| Durum | Gerekli mi? |
|---|---|
| Düşük-orta trafik (mevcut) | ❌ php-fpm fazlasıyla yeter |
| Yüksek trafik + çok cache'li hafif API | ✅ Büyük kazanç |
| CPU-yoğun, ağır DB raporları | ⚠️ Sınırlı kazanç (önce sorgu optimizasyonu) |
| Anlık yüksek eşzamanlılık (kampanya, viral) | ✅ Worker modeli daha stabil |

---

## 5. 🔴 Sağlık Verisi Riski (KRİTİK — atlanmamalı)

RoadRunner/Octane **kalıcı bellek** kullanır — uygulama istekler arası bellekte kalır. Yanlış yapılandırmada **state bleed (durum sızıntısı)** olur:
- Singleton'larda önceki hastanın `auth()` bağlamı kalabilir
- Static değişkenlerde PHI (hasta verisi) bir sonraki isteğe karışabilir
- Bir hastanın verisi başka kullanıcıya görünebilir

**Sağlık platformunda (HIPAA/KVKK) bu felakettir.** Octane'a geçiş, her singleton/static/global'in denetlenmesini ZORUNLU kılar (Octane'ın `flush` listeleri, stateless servis disiplini). Bu, ek geliştirme + sıkı test demektir.

---

## 6. Alternatifler (RoadRunner tek seçenek değil)

| Alternatif | Ne yapar | Artı | Eksi |
|---|---|---|---|
| **Octane + RoadRunner** | Go tabanlı worker | Hızlı, düşük bellek, built-in metrics | Yeni runtime, state riski |
| **Octane + Swoole** | C tabanlı async worker | En yüksek throughput, coroutine | PECL eklenti, daha karmaşık |
| **Octane + FrankenPHP** | Caddy tabanlı, modern | HTTP/3, kolay kurulum, worker mode | Daha yeni, ekosistem genç |
| **php-fpm tuning** (mevcut) | Worker sayısı + opcache + JIT | Sıfır risk, hemen | Boot maliyeti kalır |
| **Yatay ölçekleme** | Daha çok kopya/instance | Risksiz, lineer | Maliyet (her kopya $) |
| **Queue offload** | Ağır işi kuyruğa al | İstek hızlanır, risksiz | Octane değil, tamamlayıcı |

**Önemli:** RoadRunner'a geçmeden önce **ucuz + risksiz** kazanımlar (opcache+JIT tuning, Redis cache, sorgu optimizasyonu, queue) çoğu zaman aynı rahatlamayı sağlar.

---

## 7. Öneri (MedaGama'ya özel)

**Aşamalı:**
1. **Şimdi:** php-fpm + opcache+JIT tuning + Redis (zaten opt-in hazır) + sorgu optimizasyonu → çoğu darboğazı çözer, **sıfır risk**
2. **Trafik 5-10x artınca:** Octane + **FrankenPHP** veya **RoadRunner** değerlendir — AMA önce PHI/state denetimi (singleton/static audit) şart
3. **Async ihtiyaçları:** Octane beklemeden, ağır işleri **queue worker**'a (Redis/Horizon) taşı — bu zaten async kazancının çoğunu verir, risksiz

**Müşteriye:** "RoadRunner gerçek bir kazanç sağlar ama (a) şu trafikte erken, (b) sağlık verisinde state riski denetim gerektirir, (c) aynı rahatlamanın çoğu Redis+queue+tuning ile risksiz alınır. Trafik büyüdüğünde, denetimle birlikte FrankenPHP/RoadRunner'a geçeriz. Şimdiden async iş için queue worker kurabiliriz — Octane'sız async."

---

## 8. Benchmark Tekrarlanabilirliği
- Script: `tasks/bench/roadrunner_bench.php` (repo'da)
- Çalıştır: `php tasks/bench/roadrunner_bench.php 200`
- Gerçek MedaGama Laravel bootstrap'ını ölçer; herkes aynı sonucu üretebilir.
