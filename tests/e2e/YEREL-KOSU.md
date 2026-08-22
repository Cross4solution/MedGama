# E2E'yi yerel yığına karşı koşmak

## Neden

E2E paketi canlıya karşı yazılmıştı ve iki şey mümkün değildi:

1. **Doğrulanmış hekim ve klinik sahibi oturumu alınamıyordu.** Şifresiz demo
   girişi canlıda kapalı (ölçüldü: 404) ve öyle kalmalı; tohumdaki
   `doctor@demo.com` ise doğrulanmamış. Yani yayınlama, randevu onaylama ve
   CRM akışları hiç sınanamıyordu.
2. **Durum değiştiren testler canlı veriye dokunuyordu.** Paketteki "iz
   bırakma" kuralı bu yüzden vardı; yerel yığında o kısıt gereksiz.

Ayrıca yalnızca yerelde çıkan bir üretim hatası bulundu: yayın sunucusu
erişilemezken randevu ve mesajlaşma 500 veriyordu (bkz. `YayinKesintisiTest`).
Canlıda yayın sunucusu ayakta olduğu için hiç görünmüyordu.

## Kurulum

MySQL (TiDB ile aynı protokol; SQLite üretim davranışını göstermiyor):

```bash
brew install mysql && brew services start mysql
mysql -u root -e "CREATE DATABASE medagama_e2e CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Arka uç — `backend/.env.e2e` bu depoda değil, `.env.example`'dan türetin ve
şunları ayarlayın:

```
APP_ENV=local
DB_CONNECTION=mysql
DB_DATABASE=medagama_e2e
DB_SOCKET=/tmp/mysql.sock
DEMO_LOGIN_ENABLED=true
DEMO_LOGIN_KEY=<kendi anahtarınız>
```

```bash
cd backend
cp .env .env.canli.yedek        # canlı yapılandırmayı KAYBETMEYİN
cp .env.e2e .env
php artisan config:clear && php artisan migrate --force && php artisan db:seed --force
php artisan serve --host=127.0.0.1 --port=8001
```

Ön yüz:

```bash
NEXT_PUBLIC_API_ORIGIN=http://127.0.0.1:8001 npx next dev -p 3100
```

Testler:

```bash
E2E_BASE_URL=http://127.0.0.1:3100 \
E2E_API_ORIGIN=http://127.0.0.1:8001 \
E2E_DEMO_KEY=<anahtarınız> \
npx playwright test
```

`E2E_API_ORIGIN` verildiğinde kurulum YEREL KİPE geçer: bütün oturumlar
şifresiz demo girişinden alınır (hesap yoksa kendisi oluşturur) ve parola
ile giriş hiç denenmez — yerel tohumda `@demo.com` adresleri yok.

Üretilen oturumlar: `hasta`, `doktor`, `klinik`, `demoDoktor`, `demoKlinik`.

## İşiniz bitince

```bash
cd backend && cp .env.canli.yedek .env && php artisan config:clear
```

## Bilinen tuzaklar

**Bayat `.next` önbelleği 500 üretiyor.** Sayfalar SSR sırasında
`JSON.parse` hatasıyla "Internal Server Error" bastı ve bu, oturum ya da
uygulama hatası gibi göründü. Canlıda aynı sayfalar 200 dönüyordu — fark
buradan anlaşıldı. Çözüm:

```bash
rm -rf .next
```

Yerelde açıklanamayan bir 500 görürseniz ÖNCE bunu deneyin; ardından aynı
sayfayı canlıda ölçün. "Yerelde bozuk" ile "üretimde bozuk" ayrımı yapmadan
hata bildirmeyin.

**Çok işçiyle bağlantı hataları.** `--workers=4` altında Next geliştirme
sunucusu yetişemeyip `ERR_CONNECTION_REFUSED` üretiyor ve bu, test hatası
gibi okunuyor. `--workers=2` bunu ortadan kaldırdı.

**Yerel tohum canlı tohumla aynı değil.** Bazı spec'ler demo hesabının
belirli bir randevu tipini (`online`) sunduğunu varsayıyor; yerel fabrikada
öyle olmayabiliyor ve uç yetki denetimine hiç gelmeden 422 veriyor.
Kırıklarda önce yanıt gövdesine bakın.
