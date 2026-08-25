# Liste sayfalarında LCP — ölçüm ve karar

Ana sayfanın LCP'si düzeltildi (kahraman görseli CSS arka planından
`next/image` + `priority`'ye geçti: telefonda 14,1 → 3,8 sn). Liste sayfaları
düzelmedi ve nedeni ayarla ilgili değil; bu not onu kayda geçiriyor ki aynı ölçüm
baştan yapılmasın.

## Ölçüm

Telefon (375 px), yavaş 3G (400 kbps / 400 ms gecikme), yerel üretim derlemesi:

| sayfa | LCP | LCP ögesi |
|---|---|---|
| `/tr` | **3,9 sn** | kahraman görseli (düzeltildi) |
| `/tr/about` | 2,5 sn | metin |
| `/tr/search` | 10,2 sn | metin |
| `/tr/browse/clinics` | 11,6 sn | kart görseli |
| `/tr/browse/treatments` | 11,6 sn | kart görseli |
| `/tr/medstream` | 13,7 sn | kart görseli |

CLS her sayfada 0,004–0,018 — eşik 0,1, yani sorun yok.

## Darboğaz görsel değil, zincir

`/tr/browse/clinics` için zaman çizgisi:

```
DOM hazır          3,7 sn
API yanıtı        10,6 sn      ← burada bekleniyor
ilk kart görseli  11,3 sn
LCP               11,7 sn
```

Arada yedi saniye var ve orada tek bir şey oluyor: JavaScript iniyor ve
çalışıyor. İstek ancak hidrasyondan sonra başlıyor, yani kart görseli API
yanıtından önce istenemiyor. Görsele `priority` vermek bu yüzden işe yaramaz —
görselin ne olduğu, veri gelene kadar bilinmiyor.

## Denenip elenen ucuz çözümler

* **`preconnect` / `dns-prefetch`** — kazandırmaz. Üretimde API aynı köken
  (`/api`, Vercel yönlendirmesiyle arka uca gidiyor), bağlantı zaten açık.
  Akış görselleri de `/_next/image` üzerinden aynı kökenden geliyor; Unsplash'e
  giden bacak sunucu tarafında.
* **Kart görsellerine `priority`** — sıralamayı değiştirmiyor (yukarıdaki neden).
* **Daha küçük görsel** — zaten yapıldı; kart görselleri iyileştiriciden geçiyor
  ve `/tr/browse/clinics` görsel ağırlığı 244 → 75 KB indi. LCP'yi belirleyen
  o değil.

## Geriye kalan tek gerçek çözüm

İlk sonuç sayfasının SUNUCUDA render edilmesi. O zaman kartlar HTML ile
geliyor, görsel adresleri ilk taramada biliniyor ve zincirden hem JavaScript
beklemesi hem ayrı API turu düşüyor.

Bunun bedeli var ve bu yüzden yapılmadı:

* Bu ekranlar istemci bileşeni; veriyi oturuma göre çekiyorlar (favori durumu,
  kullanıcının ülkesi). Sunucuya taşımak veri yolunu ikiye ayırmak demek.
* Süzgeç ve sayfalama şu an tümüyle istemcide; ilk sayfa sunucudan gelirse iki
  kaynak arasında tutarlılık kurmak gerekiyor.
* Oturum gerektiren alanlar (yer imi, favori) sunucu render'ında ya boş gelmeli
  ya da istekle birlikte çözülmeli.

Yani bu bir ayar değil, veri akışı kararı. Ölçüldü, nedeni yazıldı, karar
müşteride.
