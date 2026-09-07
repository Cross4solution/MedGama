# Medagama — Yönetici Rehberi

Sürüm 1.0 · Eylül 2026 · Sözleşme madde 2.2 kapsamında teslim edilen belge

İki bölüm: **(A) Yönetim paneli** — platformu işleten kişi için;
**(B) İşletme** — sunucuları ve yayını yöneten teknik kişi için.

---

## A. Yönetim paneli (`/admin`)

### A.1 Giriş
- Süper yönetici hesabı sunucuda oluşturulur (bkz. B.4); e-posta ve şifreyle
  `/login` → `/admin`.
- **Görüntüleme hesabı:** `--salt-okunur` ile açılan hesap paneli gezer ama
  hiçbir kaydı ekleyemez, değiştiremez, silemez (403). Müşteri incelemesi için
  düşünüldü.
- **Demo şifresiz giriş:** `DEMO_ADMIN_AUTO_LOGIN` ortam değişkeni açıkken
  `/admin` şifresiz açılır (yalnız salt-okunur hesaba bağlanabilir). Demo
  bitince bu değişken **kaldırılmalıdır** (bkz. B.6).

### A.2 Menü

| Bölüm | Ekran | Ne yapılır |
|-----|-------|----------------|
| Genel Bakış | **Kontrol Paneli** `/admin` | Kullanıcı, randevu, gelir, bekleyen iş sayıları; acil uyarılar (doğrulama bekleyen doktor, şikâyet edilen içerik, açık destek talebi) |
| Operasyon | **Doğrulama Merkezi** `/admin/verification` | Doktor ve klinik doğrulama başvuruları: belgeleri aç, **Onayla / Reddet** (gerekçe yazılır). Onaylanmayan doktor randevu alamaz |
| | **Kullanıcı Yönetimi** `/admin/users` | Sekmeler: Tümü / Doktorlar / Hastalar / Klinikler. Ara, süz, **engelle / engeli kaldır**, **parolayı sıfırla**, rol ve seviye görüntüle, doğrulama durumu |
| | **Finans** `/admin/financials` | Fatura ve gelir özeti, dönem raporu, dışa aktar |
| Moderasyon | **Yorum Moderasyonu** `/admin/reviews` | Bekleyen / onaylı / reddedilen / gizli; doktor ve klinik yorumları ayrı sayılır |
| | **İçerik Moderasyonu** `/admin/moderation` | Şikâyet edilen gönderi ve yorumlar: gizle, sil, şikâyeti kapat |
| Sistem | **Katalog Yönetimi** `/admin/catalog` | Branşlar, tedaviler, semptom eş anlamlıları (halk dili → branş), şehir/ülke |
| | **Sistem Ayarları** `/admin/settings` | Site ayarları, özellik anahtarları (`/admin/feature-toggles`): modül aç/kapat |
| | **Denetim Kayıtları** `/admin/audit-logs` | Kim, ne zaman, neyi değiştirdi; tarih aralığı ve kullanıcıya göre süz |
| | **Destek Talepleri** `/admin/support` | Kullanıcı destek talepleri; yanıtla, kapat |
| | **Duyurular** `/admin/announcements` | Rol bazlı duyuru (hasta / doktor / klinik / hepsi), öncelik, kapatılabilir mi, aktif/pasif |

### A.3 Roller ve seviyeler

| Rol | Seviye | Not |
|------|--|------------|
| Hasta | 1 | Kayıtta e-posta doğrulaması |
| Doktor | 2 | E-posta + yönetici doğrulaması (belge) |
| Klinik | 3 | Kayıtta otomatik doğrulanır; CRM paketiyle CRM açılır |
| Hastane / grup | 4 | Otomatik doğrulanır; CRM her zaman açık; şubeleri yönetir |
| Süper yönetici | 5 | Tam yetki |

### A.4 Günlük işleyiş önerisi
1. Kontrol panelindeki uyarıları sıfırlayın: bekleyen doğrulama, şikâyet,
   destek.
2. Yorum moderasyonunda bekleyenleri geçirin (yalnız tamamlanmış randevusu
   olan hasta yorum yazabildiği için sahte yorum beklenmez; yine de içerik
   denetimi gerekir).
3. Haftada bir denetim kayıtlarını gözden geçirin.

---

## B. İşletme

### B.1 Bileşenler ve nerede çalıştıkları

| Bileşen | Yer | Not |
|--------|--------|--------|
| Ön yüz (Next.js) | Vercel — `med-gama.vercel.app` | `main` dalına push → otomatik yayın |
| Arka uç (Laravel 11) | Render — `medagama-backend.onrender.com` | Docker; ortam değişkenleri Render panelinden |
| Veritabanı | TiDB Cloud (MySQL uyumlu) | Yerelde PostgreSQL/MySQL, testte SQLite |
| Sinyal + TURN (görüntülü görüşme) | OVH `57.128.27.244` | soketi (Docker) + coturn, TLS |
| **Alt yazı motoru + çeviri** | OVH, Docker | `deploy/stt/README.md` |
| Dosyalar (PHI) | Arka uç diski, şifreli | AWS S3'e taşınması müşteride (tutanak) |

### B.2 Yayın (deploy)
- Ön yüz: `git push origin <dal>:main` → Vercel derler (2–4 dk). Derleme
  öncesi yerelde `npm run build` yeşil olmalı.
- Arka uç: aynı push Render'ı tetikler; konteyner açılışında göçler koşar
  (`backend/docker/entrypoint.sh`). Göç gerekiyorsa Render konsolundan
  `php artisan migrate --force`.
- Geri alma: `docs/GERI-ALMA-PLANI.md`.

### B.3 Ortam değişkenleri (Render)
Tam liste `docs/PRODUCTION_DEPLOYMENT.md`. Bu teslimle **eklenenler**:

```
CAPTIONS_ENGINE=whisper
CAPTIONS_WHISPER_URL=https://57-128-27-244.sslip.io/stt
CAPTIONS_WHISPER_SECRET=<sunucudaki /etc/medagama/stt.env ile aynı>
TRANSLATE_PROVIDER=libretranslate
LIBRETRANSLATE_URL=https://57-128-27-244.sslip.io/lt
```

### B.4 Yönetici hesabı açma
Render → servis → Shell (ya da yerel):
```bash
php artisan yonetici:olustur yonetici@alanadi.com            # tam yetki
php artisan yonetici:olustur inceleyen@alanadi.com --salt-okunur
```
Şifre komut içinde gizli sorulur; zayıf şifre reddedilir. Ayrıntı:
`docs/MUSTERIYE-PANEL-ERISIMI.md`.

### B.5 Yedek ve geri yükleme
`docs/YEDEK-VE-GERI-YUKLEME.md` ve `docs/RPO-RTO.md`. Veritabanı yedeği
TiDB Cloud'da; dosya yedeği S3 bağlanınca tamamlanır.

### B.6 Teslim sonrası yapılacaklar
- `DEMO_ADMIN_AUTO_LOGIN` değişkenini Render'dan **kaldırın** (şifresiz
  panel girişi kapanır).
- Alan adı bağlanınca: Vercel alan adı, Resend e-posta alan adı doğrulaması
  (`docs/Medagama_Eposta_Secenekleri.pdf`), OVH sertifikası ve
  `REVERB_HOST` / `TURN_URLS` / `CAPTIONS_WHISPER_URL` yeni alan adına.
- GPU sunucu gelince alt yazı motorunu büyütün (`deploy/stt/README.md`).

### B.7 Sağlık kontrolleri
```bash
curl -s https://medagama-backend.onrender.com/api/health          # ok
curl -s https://57-128-27-244.sslip.io/stt/health                   # {"ok":true,...}
curl -s https://57-128-27-244.sslip.io/lt/languages | head -c 100  # çeviri
```
Olay yönetimi: `docs/SECURITY_INCIDENT_RUNBOOK.md`.

### B.8 Testler
```bash
cd backend && php artisan test                 # arka uç (SQLite)
npm run test:unit                               # ön yüz birim ölçütleri
E2E_BASE_URL=... E2E_API_ORIGIN=... E2E_DEMO_KEY=... npx playwright test   # uçtan uca
```
API dokümanı: `backend/docs/openapi.yaml`.
