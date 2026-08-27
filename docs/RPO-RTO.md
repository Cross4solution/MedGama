# RPO ve RTO — ne kadar veri kaybı, ne kadar kesinti

İki soru, iki sayı:

| | Soru | Şu anki değer |
|---|---|---|
| **RPO** | Arıza anında ne kadar veri kaybederiz? | **en fazla 6 saat** |
| **RTO** | Ne kadar sürede geri döneriz? | **teknik olarak dakikalar**, gerçekte fark etme süresine bağlı |

Bu sayılar hedef değil, **ölçülmüş mevcut durum**. Hedefleri siz belirlersiniz;
aşağıdaki bölüm bunları iyileştirmenin maliyetini gösteriyor.

---

## RPO: en fazla 6 saat

Yedek günde dört kez alınıyor: **04:10, 10:10, 16:10, 22:10**. Arıza saat
15:00'te olduysa 10:10'dan sonraki her şey gider:

- o gün alınan randevular
- yazılan mesajlar
- kesilen faturalar
- yüklenen belgelerin **veritabanı kayıtları** (dosyalar diskte kalır — bkz. aşağısı)

Önceden gecede tek yedek vardı ve pencere 24 saatti — o sabah alınan bir
randevu öğleden sonraki arızada kayboluyordu ve kimse bilmiyordu: hasta gelir,
kaydı yoktur. Dört yedekle pencere 6 saate indi.

### Neden dört, daha fazla değil

Ölçüldü — 200.000 randevuluk bir veritabanında:

| | Boyut |
|---|---|
| Veritabanı | 33 MB |
| Ham döküm | 91 MB (2,73 kat) |
| **Sıkıştırılmış döküm** | **4,4 MB** (0,13 kat) |

Yedekler sıkıştırılıyor, yani sıklığı artırmak ucuz:

| Randevu sayısı | Yedek boyutu | Günde 4 yedek, 7 gün saklama |
|---|---|---|
| 1 milyon | 22 MB | 0,6 GB |
| 5 milyon | 111 MB | 3,0 GB |

Disk 10 GB. Günde dört yedek rahatça sığıyor; daha da sıklaştırmak mümkün ama
kazanç azalıyor — asıl zayıflık aşağıda.

> Sıkıştırma olmasaydı 5 milyon randevuda yedi günlük **tek** günlük yedek bile
> 15,5 GB ederdi ve diske sığmazdı. Arıza sessiz olurdu: disk dolar, yedek
> yazılamaz, kimse fark etmez — ta ki yedeğe ihtiyaç duyulana kadar.

> Yedek saatleri budama işlerinden (03:00–03:40) SONRA seçildi. Önce alınsaydı
> o gece silinen kayıtlar yedekte yaşamaya devam eder, "silindi" dediğimiz veri
> geri gelebilir hâlde kalırdı.

---

## RTO: geri dönüş süresi

Ölçülen kısım hızlı:

| Adım | Süre |
|---|---|
| Yedek alma + geri yükleme provası (mevcut boyut) | 1,7 sn |
| 1 milyon randevuda geri yükleme (öngörü) | birkaç dakika |
| Render'da önceki sürüme dönüş | birkaç dakika |

**Ama RTO bu değil.** Gerçek süreyi belirleyen üç şey:

1. **Fark etme** — arıza ne kadar sonra anlaşıldı? Sentry hata yakalıyor, ama
   "veri bozuldu" hataya dönüşmeyebilir. En uzun kalem genelde budur.
2. **Karar** — geri mi alalım, ileri mi düzeltelim? `docs/GERI-ALMA-PLANI.md`
   bu kararı hızlandırmak için var.
3. **Doğrulama** — geri yükledikten sonra çalıştığından emin olmak.

Yani "RTO 5 dakika" demek yanlış olur. Dürüst ifade: **geri yükleme dakikalar
sürer; toplam kesinti, arızanın ne kadar çabuk fark edildiğine bağlıdır.**

---

## Bu sayıların kapsamadığı: dosyalar

Yedek yalnız **veritabanını** kapsıyor. Hasta belgeleri, sohbet ekleri ve hekim
diplomaları kalıcı diskte duruyor ve **yedeklenmiyor**.

Sonuç: veritabanı geri yüklendiğinde dosyalar geri gelmez.

- Kayıt var, dosya yok → belge açılmaz
- Dosya var, kayıt yok → dosya sahipsiz kalır

**Dosya deposu için RPO şu an tanımsız** — yedek olmadığı için. Bu, S3'e
geçildiğinde çözülür: nesne depolamanın kendi sürümleme ve yedekleme
mekanizmaları var.

---

## Özet: bugünkü gerçek durum

| | Veritabanı | Dosyalar |
|---|---|---|
| Yedek var mı | ✅ günde 4 kez, sıkıştırılmış | ❌ yok |
| Geri yüklenebilirliği denendi mi | ✅ her `--dogrula` koşusunda | — |
| Sunucu dışında mı | ❌ aynı makinede | ❌ aynı makinede |
| RPO | 6 saat | tanımsız |

**En zayıf halka yedeğin sunucu dışında olmaması.** Makineyi kaybettiren bir
arızada hem veritabanı hem dosyalar hem de yedekleri birlikte gider — yani
yedeğin varlığı o senaryoda hiçbir şey değiştirmez.

`YEDEK_DISK` (ve dosyalar için `PHI_DISK`) sunucu dışı bir depoya
bağlanmadan, buradaki RPO/RTO sayıları yalnızca **yazılım arızaları** için
geçerlidir; donanım arızası için değil.
