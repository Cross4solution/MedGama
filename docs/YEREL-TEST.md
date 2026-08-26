# Yerel test yığını — MySQL ve e2e

Paketin iki koşum biçimi var. Varsayılan (SQLite) hızlıdır ve her zaman
çalışmalıdır. MySQL koşusu ise **canlı sürücüyle aynı** olduğu için teslimden
önce en az bir kez yapılmalıdır.

---

## 1. Neden MySQL'e karşı da koşuyoruz

Testler varsayılan olarak SQLite üzerinde çalışıyor, canlıda ise TiDB
(MySQL protokolü) var. İkisi sessizce ayrışıyor ve bu ayrışma **canlıya
hata gönderdi**:

- `ESCAPE '\'` SQLite'ta geçerli, MySQL'de dizgeyi bozuyor → arama ucu
  canlıda her istekte 500 verdi, 672 testin hepsi yeşilken.
- SQLite `LOWER()` yalnız ASCII katlıyor; Türkçe katlama testleri orada
  atlanmak zorunda.

**Kural:** ham SQL'e dokunan (`whereRaw`, `selectRaw`, `ESCAPE`, `REGEXP`,
`::cast`) her değişiklikten sonra MySQL koşusu yapılmalı. Yerel yeşil ekran
tek başına kanıt değil.

### Kurulum

```bash
brew install mysql
brew services start mysql
mysql -u root -e "CREATE DATABASE medagama_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Koşum

```bash
cd backend
php artisan test -c phpunit.mysql.xml
```

`phpunit.mysql.xml` depoda duruyor; `phpunit.xml`'e dokunulmuyor, yani
SQLite koşusu olduğu gibi kalıyor.

**SSL notu:** uygulama yapılandırması TiDB için SSL zorunlu kılıyor. Yerel
MySQL kendi imzaladığı sertifikayı kullandığından yapılandırmada sunucunun
kendi CA'sı gösteriliyor (`/opt/homebrew/var/mysql/ca.pem`). Üretim
yapılandırması değişmiyor.

---

## 2. E2E — yerel yığına karşı

E2E paketi eskiden yalnız canlıya karşı koşuyordu. İki sorun vardı:

1. **Doğrulanmış hekim ve klinik oturumu alınamıyordu.** Şifresiz demo
   girişi canlıda kapalı (ölçüldü: 404 — ve öyle kalmalı), tohumdaki
   `doctor@demo.com` ise doğrulanmamış. Yayınlama ve randevu onaylama
   akışları hiç sınanamıyordu.
2. **Durum değiştiren testler canlı veriye dokunuyordu.** Paketin "iz
   bırakma" kuralı bu yüzden vardı.

Yerel yığın ikisini de çözüyor.

### Yığını ayağa kaldır

```bash
# 1) Ayrı bir veritabanı — canlıya ASLA yöneltme, testler tabloları düşürür
mysql -u root -e "DROP DATABASE IF EXISTS medagama_e2e; CREATE DATABASE medagama_e2e CHARACTER SET utf8mb4;"

# 2) backend/.env.e2e hazırla (depoda değil, .gitignore'da)
#    DB_DATABASE=medagama_e2e, APP_ENV=local, DEMO_LOGIN_ENABLED=true,
#    DEMO_LOGIN_KEY=<bir anahtar>
#    CORS_ALLOWED_ORIGINS listesine http://127.0.0.1:3100 EKLE
cd backend && cp .env .env.canli.yedek && cp .env.e2e .env
php artisan config:clear && php artisan migrate --force && php artisan db:seed --force
php artisan serve --host=127.0.0.1 --port=8001
```

```bash
# 3) Ön yüz — GELİŞTİRME KİPİNDE DEĞİL, ÜRETİM DERLEMESİYLE
NEXT_PUBLIC_API_ORIGIN=http://127.0.0.1:8001 npx next build
NEXT_PUBLIC_API_ORIGIN=http://127.0.0.1:8001 npx next start -p 3100
```

### Koş

```bash
E2E_BASE_URL=http://127.0.0.1:3100 \
E2E_API_ORIGIN=http://127.0.0.1:8001 \
E2E_DEMO_KEY=<anahtar> \
npx playwright test --workers=2
```

`E2E_API_ORIGIN` verildiğinde kurulum **yerel kipe** geçer: bütün oturumlar
şifresiz demo girişinden alınır (hasta, doktor, klinik) ve parola ile giriş
hiç denenmez — yerel tohumda `@demo.com` hesapları yok.

**İş bitince `.env`'i geri al:** `cp .env.canli.yedek .env`

---

## 3. Zamanı boşa harcatan üç tuzak

Bu üçü ölçülerek bulundu; hepsi testleri kırık gösterip saatler yedi.

**Üretim derlemesi kullan, `next dev` değil.** Geliştirme kipi her rotayı
istendiğinde derliyor: aynı paket 60 dakika sürdü ve 15 test zaman aşımına
düştü. Üretim derlemesinde sayfalar 6–95 ms'de geliyor ve paket 5 dakika
sürüyor. Kırıkların çoğu "hata" değil, derleme beklemesiydi.

**Bayat `.next` önbelleği sayfaları 500'e düşürüyor.** SSR'da
`JSON.parse` hatası veriyor. Canlıda aynı sayfalar 200 dönüyordu — yani
uygulama hatası değil. Çözüm: `rm -rf .next`.

Bunun daha sinsi hâli: **sunucu ayaktayken altından `next build` yapmak.**
Sunucu eski dosya adlarını sunmaya devam ediyor, tarayıcı var olmayan
yığınları isteyip 400 alıyor ve sayfa BOMBOŞ geliyor. Tek bir oturumda altı
kez uygulama hatası sanıldı ("Arapça kayıt sayfası çöküyor", "404 sayfası
boş"). En kötüsü, portu önizleme yöneticisinin tuttuğu ve `pkill -f "next
start"` komutunun ona hiç ulaşmadığı durum.

Şüphelendiğiniz an sorun:

```bash
npm run sunucu:tazelik
```

Sayfanın istediği her varlığın diskte olup olmadığına bakıyor. `✗ BAYAT
SUNUCU` diyorsa aradığınız hata orada değil.

**CORS listesine yerel kökeni eklemeyi unutma.** Eksikse kimlikli her istek
tarayıcıda engelleniyor ve testler "öge bulunamadı" diye kırılıyor; sebep
hiçbir yerde yazmıyor.

**4 işçi yerel API'yi hız sınırına takıyor** (429). `--workers=2` kullan.

**Melez kurulum (yerel ön yüz → CANLI arka uç) kendiliğinden çalışmaz.**
Tarayıcı tarafındaki `src/config/apiBase.js` vekili yalnız `*.vercel.app` ve
`medagama.com` alan adlarında kullanıyor; `localhost`'ta `REACT_APP_API_BASE ||
http://127.0.0.1:8001/api` adresine gidiyor. Yani `next start`'ı canlı arka uca
bakan bir derlemeyle açsanız bile tarayıcı Next vekilini ATLAYIP yereldeki
olmayan arka ucu arıyor: oturum gerektiren her test "oturum kurulmadı" diye
düşüyor ve sebep hiçbir yerde yazmıyor. Derlemeyi şöyle yapın:

```bash
REACT_APP_API_BASE=https://medagama-backend.onrender.com/api npx next build
```

Ama bu yol yine de parolayla giriş yapar ve arka arkaya koşularda 429'a
takılırsınız. Yukarıdaki **yerel yığın** yordamı (`E2E_API_ORIGIN` + şifresiz
demo girişi) hız sınırına hiç dokunmadığı için tercih edilmeli.

---

## 4. Kalan e2e kırıkları hakkında

Yerel koşuda birkaç test kırık kalıyor ve bunlar **uygulama hatası değil**:

- `giris.spec.js` — parolayla giriş yapıyor; `@demo.com` hesapları yerelde yok
- `dinamik-sayfalar.spec.js` — kimlikleri CANLIDAN çekiyor
- `randevu-yasam-dongusu` / `randevu-eszamanlilik` — yerel tohumda uygun
  randevu türü/slot ön koşulu oluşmuyor
- hız sınırına takılanlar

Bunları düzeltmek spec'leri yerel veriden türetecek şekilde yazmayı
gerektiriyor; yapılırsa buradaki liste güncellenmeli.

## Gerçek sürücüye karşı koşmak (MySQL)

Varsayılan paket SQLite üzerinde koşuyor ve SQLite **iki şeyi sessizce
farklı yapıyor**: `varchar` uzunluğunu uygulamıyor ve `LOWER()` Türkçe
harfleri katlamıyor. İkisi de üretimde (TiDB/MySQL) farklı davranıyor, yani
paket yeşilken canlı bozuk olabiliyor — bir kez oldu:
`chat_messages.attachment_url` şifreli değeri taşıyamıyordu ve sohbete dosya
eklemek canlıda 500 veriyordu. Yerelde hiçbir test kırmızı yanmıyordu.

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS medagama_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

cd backend
DB_CONNECTION=mysql DB_HOST=127.0.0.1 DB_PORT=3306 \
DB_DATABASE=medagama_test DB_USERNAME=root DB_PASSWORD= \
DB_SSL_DISABLED=1 \
php artisan test
```

`DB_SSL_DISABLED=1` gerekiyor: yapılandırma canlıdaki TiDB için SSL'e
zorluyor ve macOS'ta yerel MySQL'e SSL ile bağlanılamıyor.

Bu koşuda **üç test daha çalışıyor** (SQLite'ta atlanan Türkçe katlama
ölçütleri) ve `SifreliSutunGenisligiTest` bütün şifreli alanların sütun
türünü denetliyor. Sürücüye bağlı bir hata aranıyorsa ilk yapılacak şey bu.

## Neden yığın SQLite ile koşulmamalı

Yerel arka uç `.env` içinde `DB_CONNECTION=sqlite` ile geliyordu. Üretim ise
TiDB (MySQL uyumlu). Aradaki fark test edilebilirliği doğrudan etkiliyor,
çünkü SQLite **iki kuralı hiç uygulamıyor**:

| | SQLite | MySQL / TiDB |
|---|---|---|
| `varchar(N)` uzunluğu | yok sayar | `Data too long` hatası |
| `LOWER()` Türkçe harfler | katlamaz | katlar |

Bunun bedeli ölçüldü: `chat_messages.attachment_url` sütunu şifrelenmiş
değeri taşıyamıyordu ve **sohbete dosya eklemek canlıda 500 veriyordu**.
Birim paketi de e2e paketi de yeşildi, çünkü ikisi de SQLite üzerinde
koşuyordu. Aynı sınıftan dört alan daha bulundu (doğrulama 500 karaktere
izin verirken sütun 255 tutuyordu).

Yerel arka ucu üretimin sürücüsüne çevirmek için `backend/.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=medagama_e2e
DB_USERNAME=root
DB_PASSWORD=
DB_SSL_DISABLED=1
```

Ardından `php artisan config:clear && php artisan migrate --force && php artisan db:seed --force`.

Sürücüye bağlı bir kusur, üretimin kullandığı sürücüde koşulana kadar
görünmez — bu dosyadaki en pahalı ders bu.

