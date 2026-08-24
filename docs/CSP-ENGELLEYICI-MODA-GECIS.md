# CSP: raporlama modundan engelleyici moda geçiş

**Durum:** karar bekliyor. Bu belge kararı vermek için gereken ölçümleri taşıyor;
bir öneri değil, bir kanıt dosyası.

**İlgili test:** `src/utils/__tests__/guvenlikBasliklari.test.mjs` — mevcut modu
kaydediyor ve engelleyiciye geçildiğinde kasten kırılacak.

---

## Neden karar bekliyor

Politika bugün `Content-Security-Policy-Report-Only` olarak gönderiliyor. Bu
modda tarayıcı ihlalleri **bildiriyor ama engellemiyor**. Yani bir betik
enjeksiyonu gerçekleşirse kaydediliyor, durdurulmuyor.

Engelleyici moda geçmenin tek riski ters yönde: politikanın hesaba katmadığı
meşru bir kaynak varsa, o özellik **kullanıcılarda sessizce çalışmaz hâle
gelir**. Bu yüzden geçişten önce ölçüm gerekiyor.

## Ölçülenler (canlı: `med-gama.vercel.app`)

### Politikanın kendisi eksiksiz

```
default-src     'self'
script-src      'self' 'unsafe-inline' 'unsafe-eval' googletagmanager mapbox
style-src       'self' 'unsafe-inline' mapbox
img-src         'self' data: blob: https:
font-src        'self' data:
connect-src     'self' google-analytics mapbox events.mapbox
                medagama-backend.onrender.com  wss://57-128-27-244.sslip.io
frame-src       'self' youtube youtube-nocookie
media-src       'self' blob: https:
worker-src      'self' blob:
object-src      'none'
base-uri        'self'
form-action     'self'
frame-ancestors 'none'
report-uri      /api/csp-report
```

Kırılmaya en yatkın yönerge `connect-src` ve orada **görüntülü görüşme soketi
(`wss://…sslip.io`) ile arka uç zaten listede.**

### Sekiz sayfada ihlal izi yok

- Dış köken taraması (8 genel sayfa, 412 KB HTML): **hiç harici `script`,
  `iframe` ya da `stylesheet` kökeni yok**.
- Tarayıcı konsolu (ana sayfa, akış, giriş): **sıfır ihlal**.
- Şifresiz (`http://`) kaynak: **yok** — yani `upgrade-insecure-requests`
  eklemek bugün hiçbir şeyi bozmaz.

### Ön yüzde Sentry yok

Sentry yalnız arka uçta (`sentry/sentry-laravel`). Tarayıcıdan olay
gönderilmediği için `connect-src`'ye ek bir köken gerekmiyor. (Ön yüze Sentry
eklenirse bu satır geçersizleşir.)

## Ölçülemeyenler

Bunlar kararın açık tarafı:

1. **Giriş arkasındaki yüzeyler.** CRM, sohbet ekleri, görüntülü görüşme odası
   ve yönetim ekranları hesap gerektirdiği için taranamadı. Riskli olan
   `connect-src`; sohbet ekleri imzalı bağlantılarla geldiği için `img-src
   https:` altında kalıyor, ama telehealth odası canlı bir oturumla
   doğrulanmalı.
2. **Gerçek trafikten gelen ihlal raporları.** `/api/csp-report` ucu raporları
   topluyor. Karardan önce bakılması gereken asıl yer orası: birkaç günlük
   gerçek kullanıcı trafiğinde hiç rapor yoksa geçiş güvenli demektir.

## Geçilirse yapılacaklar

1. `next.config.js` içinde başlık adını `Content-Security-Policy-Report-Only`
   yerine `Content-Security-Policy` yap.
2. Politikaya `upgrade-insecure-requests` ekle. (Raporlama modunda tarayıcı bu
   yönergeyi yok sayıp konsolu uyarıyla dolduruyor, o yüzden şimdi yok.)
3. `guvenlikBasliklari.test.mjs` içindeki "CSP hâlâ raporlama modunda" testini
   güncelle — kasten kırılacak şekilde yazılmıştı.
4. Geçişten sonra telehealth odasını ve CRM'i canlı bir oturumla bir kez elle
   dolaş; kırılırsa ilk bakılacak yer `connect-src`.

## Not: `unsafe-inline` ve `unsafe-eval`

`script-src` ikisini de taşıyor ve bu, XSS korumasını belirgin biçimde
zayıflatıyor — engelleyici moda geçmek bu zaafı ortadan kaldırmıyor.
Kaldırmanın yolu Next'in nonce desteği; ayrı ve daha büyük bir iş, bu kararın
parçası değil.
