# SEO Analytics Kurulumu — GA4 + Google Search Console

Bu doküman MedaGama (Next.js) için Google Analytics 4 ve Google Search Console
kurulumunu adım adım anlatır. Tüm entegrasyon **env-tabanlıdır**: env değişkeni
set edilmezse hiçbir script/meta yüklenmez (güvenli + performanslı).

İlgili env değişkenleri (`.env` / Vercel Environment Variables):

| Değişken | Açıklama | Format |
|----------|----------|--------|
| `NEXT_PUBLIC_GA_ID` | GA4 Measurement ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console HTML tag kodu | `abc123...` (content değeri) |

---

## 1. Google Analytics 4 (GA4) Kurulumu

1. https://analytics.google.com adresine git, Google hesabınla giriş yap.
2. **Yönetici (Admin)** → **Mülk oluştur (Create Property)**.
   - Mülk adı: `MedaGama`
   - Saat dilimi: `(GMT+03:00) İstanbul`, Para birimi: TRY
3. **Veri akışı (Data Stream)** → **Web** seç.
   - Website URL: `https://med-gama.vercel.app`
   - Akış adı: `MedaGama Web`
4. Oluşturulan akışta **Measurement ID** görünür: `G-XXXXXXXXXX`.
5. Bu değeri env'e ekle:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
   - Local: `.env` dosyasına yaz.
   - Production: Vercel → Project → Settings → Environment Variables → ekle → **Redeploy**.

### Çerez onayı (önemli — KVKK/GDPR)
GA4 **yalnızca** kullanıcı çerez banner'ında **analitik (analytics)** onayı verince
yüklenir. Onay verilmeden GA script'i hiç eklenmez. Kullanıcı sonradan onay verirse
(banner → "Kabul Et") GA o an otomatik yüklenir. Bu davranış `app/Analytics.jsx`
içinde `useCookieConsent()` ile sağlanır.

### Doğrulama
- Onay verdikten sonra GA4 → **Raporlar → Gerçek zamanlı (Realtime)** ekranında
  kendi ziyaretini görmelisin.
- Tarayıcı Network sekmesinde `googletagmanager.com/gtag/js` isteği görünmeli
  (yalnızca onay verilmişse).
- Sayfa gezinmelerinde (locale değişimi dahil: `/tr`, `/en` ...) pageview gönderilir.

---

## 2. Google Search Console Doğrulama

1. https://search.google.com/search-console adresine git.
2. **Özellik ekle (Add property)** → **URL ön eki (URL prefix)** sekmesi.
   - URL: `https://med-gama.vercel.app`
3. Doğrulama yöntemlerinden **HTML etiketi (HTML tag)** seç.
   - Sana şuna benzer bir meta etiketi verir:
     ```html
     <meta name="google-site-verification" content="ABC123def456..." />
     ```
4. `content="..."` içindeki değerin **tamamını** kopyala ve env'e ekle:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=ABC123def456...
   ```
   (sadece content değeri — `<meta...>` tag'ini değil.)
5. Vercel'e ekle ve **Redeploy** et. Deploy bitince Search Console'da **Doğrula**'ya bas.
   - Next.js metadata API'si meta tag'i `<head>` içine otomatik basar
     (`app/layout.jsx` → `metadata.verification.google`).

### Doğrulama
- Deploy sonrası sayfa kaynağında (View Source) şu satır görünmeli:
  ```html
  <meta name="google-site-verification" content="ABC123def456..."/>
  ```
- Search Console "Doğrula" butonu yeşil onay vermeli.

---

## 3. Sitemap Gönderimi

Doğrulama tamamlandıktan sonra sitemap'i gönder:

1. Search Console → sol menü → **Site haritaları (Sitemaps)**.
2. "Yeni site haritası ekle" alanına gir:
   ```
   sitemap.xml
   ```
   (Tam URL: `https://med-gama.vercel.app/sitemap.xml`)
3. **Gönder (Submit)**'e bas.
4. Durum **"Başarılı (Success)"** olmalı; Google URL'leri taramaya başlar
   (indeksleme birkaç gün sürebilir).

---

## Özet kontrol listesi
- [ ] `NEXT_PUBLIC_GA_ID` env set edildi + redeploy
- [ ] Çerez banner'ında analitik onayı verilince GA realtime'da görünüyor
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env set edildi + redeploy
- [ ] Search Console doğrulaması yeşil
- [ ] `sitemap.xml` gönderildi, durum "Başarılı"
