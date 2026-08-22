# Lessons

## 2026-06-16 — Next App Router: page server'a geçince screen'e 'use client' ŞART
- **Hata:** Public route page.jsx'lerden `'use client'` kaldırıp server component yaptım (generateMetadata için). Ama asıl screen component'ler (HomeV2, DoctorProfile, vb.) `'use client'` direktifi içermiyordu — eskiden page.jsx onu sağlıyordu. Build kırıldı: "You're importing a component that needs useState/useEffect. This React Hook only works in a Client Component."
- **Kural:** page.jsx'i server'a çevirirken, o page'in render ettiği hook kullanan HER screen/component dosyasının başına `'use client';` ekle. Boundary page'den screen'e kaydı; screen artık kendi boundary'sini ilan etmeli.
- **Kural:** Bu zincir transitif — PrivateRoute gibi ara wrapper'lar da hook kullanıyorsa onlara da `'use client'` gerekir.

## 2026-05-08 — Push öncesi TÜM değişen PHP dosyalarını lint et
- **Hata:** Main'e push ettim, sadece `routes/api.php` ve frontend build'i kontrol ettim. `BillingService.php` heredoc'ta ternary parse error içeriyordu (line 365) — backend boot'u komple kırıyordu. Kırık kod canlıya (Render) gitti, ikinci push'la düzeltildi.
- **Kural:** Push öncesi `git diff --name-only` ile değişen TÜM `.php` dosyalarını `php -l` ile lint et. Sadece elle dokunduklarımı değil, merge sonucu değişen hepsini.
- **Kural:** Merge sonrası deploy etmeden önce backend boot smoke-test zorunlu (`php -l` tüm değişen PHP).

## PHP heredoc kuralı
- Heredoc içinde SADECE değişken interpolation çalışır. Ternary/method-chain/fonksiyon çağrısı parse error verir.
- Çözüm: değeri heredoc öncesi bir değişkene hesapla, heredoc'ta `{$var}` kullan.

## Bir ayar "çalışmıyor" derken yazma yoluna kilitlenme

**Olay:** İçerik çevirisi anahtarı. İlk teşhisim yalnızca ön yüzdeki bayat
durumdu (58456f0) — gerçek hata sunucudaydı: ayarı OKUYAN uç
(`/api/translation/status`) auth'suz açık rotaydı, `$request->user()` null
geliyor ve giriş yapmış herkese `enabled: false` diyordu (7cb7672).

**Kural:** Bir tercih kaydedilip de etkisiz görünüyorsa, yazma ucuyla OKUMA
ucunu ayrı ayrı ölç. İkisi çelişiyorsa hata okuma tarafındadır. Burada
`notification-preferences` `true`, `translation/status` `false` diyordu —
çelişki teşhisi tek başına verdi.

**İkinci kural:** Rotanın "herkese açık" olması ile "jeton gelirse kullanıcıyı
çözmesi" farklı şeyler. Açık rotada kullanıcıya bakan her uç `optional.auth`
ister.

**Test tuzağı:** `actingAs` muhafazayı doğrudan kurar; ara katman silinse bile
test geçer. Ara katmanı kanıtlamak için gerçek `Authorization: Bearer` şart.

**PHP tuzağı:** `AYARLAR + ['k' => true]` SOLDAKİ anahtarı korur, ezmez.
Varsayılanı geçersiz kılmak için `array_merge`.

## JSON yanıtında ham metin araması sessizce boşa çıkıyor

**Olay:** Sohbet sızıntı testlerinde `assertStringNotContainsString('göğsümde
baskı', $yanit->getContent())` yazdım. Laravel JSON'u `ö` biçiminde
kaçırdığı için ham gövde o baytları HİÇBİR ZAMAN içermiyor — doğrulama her
koşulda geçiyordu. Aramanın tek dayanağı buydu; test hiçbir şey ölçmüyordu.

**Kural:** Yanıt gövdesinde sızıntı ararken ASCII dışı metin kullanma.
`$yanit->json()` ile çözülmüş yapıya bak, alanları toplayıp karşılaştır.
UUID gibi ASCII değerlerde dizge araması güvenli.

**Genel kural:** Her negatif doğrulamanın yanına pozitif kontrol koy —
"katılımcı kendi mesajını BULABİLİYOR". Onsuz "yabancı bulamadı" sonucu,
aramanın hiç çalışmamasıyla ayırt edilemez. Bu tuzağı bana yine pozitif
kontrol yakalattı.

## Yerel sürücü, canlıdaki sözdizimi hatasını gösteremez

**Olay:** Aramadaki joker karakter açığını `ESCAPE '\'` ekleyerek kapattım.
MySQL/TiDB dizge içinde ters bölüyü kaçış sayıyor → literal kapanmıyor →
`/api/search/live` canlıda HER terim için 500 verdi. SQLite ters bölüyü düz
karakter saydığı için 557 testin hepsi yeşildi.

**Kural:** Ham SQL'e (whereRaw, ESCAPE, TRANSLATE, ::cast, REGEXP) dokunan
her değişiklikte, yerel testin yeşil olması KANIT DEĞİL. En az bir kez
canlı uca istek at ya da üretilen SQL'i doğrula.

**İkinci kural:** Sürücü farkını yakalayamayan durumlarda davranış yerine
ÜRETİLEN SQL'i test et (`$query->toSql()`).

## "0 sonuç" düzeltmenin kanıtı değil

Canlıda `q=%` için 0 doktor gördüm ve "düzeltme canlıda" dedim. Oysa 0
sonuç 500 hatasından geliyordu. HTTP kodunu okumadan sonuç sayısına bakmak
yanlış çıkarım üretti.

**Kural:** Canlı ölçümde önce durum kodu, sonra gövde.

## git checkout işlenmemiş düzeltmeyi siler

Kanıt döngüsünde `git checkout --` ile geri alırken, henüz işlemediğim
düzeltmeyi de sildim ve farkında olmadan hatalı sürüme döndüm.

**Kural:** Kanıt döngüsünden ÖNCE düzeltmeyi işle, ya da yedek kopya (cp)
kullan — checkout committed hâle döner, yazdığın koda değil.

## "Yerelde bozuk" ile "üretimde bozuk" ayrımı

**Olay:** Yerel e2e'de sayfalar "Internal Server Error" bastı, günlükte SSR
sırasında `JSON.parse` hatası vardı. Uygulama hatası gibi görünüyordu; kod
okuyup `PatientInvoices.jsx`'te sahte bir hata bile "buldum" (`??` zinciri
sanki diziyi kaçırıyor sandım).

Kesici `response.data` döndürdüğü için o kod DOĞRUYDU. Asıl ayrımı canlı
ölçüm verdi: aynı sayfalar canlıda 200. Sebep bayat `.next` önbelleğiydi.

**Kural:** Yerelde çıkan bir hatayı üretim hatası ilan etmeden önce AYNI
şeyi canlıda ölç. İki ortam arasındaki fark, hatanın hangisine ait olduğunu
söyler — kod okuyarak tahmin etme.

**İkinci kural:** `rm -rf .next` yerel açıklanamayan 500'lerde ilk denenecek
şey.

## E2E kırıklarını sınıflandırmadan rapor etme

23 kırıktan 16'sı `ERR_CONNECTION_REFUSED`'dı — 4 işçi altında Next'in
yetişememesi. Ortamsal. Gerçek olan 2 taneydi ve biri ciddi bir üretim
hatasına (yayın kesintisi randevuyu öldürüyor) çıktı.

**Kural:** Kırık sayısını değil, kırık SINIFINI raporla. Önce hata
mesajlarına göre grupla, sonra her grup için "bu ortam mı uygulama mı"
sorusunu ölç.
