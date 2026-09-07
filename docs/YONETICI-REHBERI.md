# Medagama — Yönetici Rehberi

Sürüm 1.1 · Eylül 2026 · Sözleşme madde 2.2 kapsamında teslim edilen belge

## Kısaca

İki okuyucu için iki bölüm:

- **A. Yönetim paneli** — platformu günlük işleten kişi için: doktor
  doğrulama, kullanıcılar, yorum denetimi, duyurular. Teknik bilgi gerekmez.
- **B. İşletme** — sunucuları ve yayını yöneten teknik kişi için: nerede ne
  çalışıyor, nasıl yayınlanır, yedek, sağlık kontrolü.

---

## A. Yönetim paneli

### A.1 Giriş
- Yönetici hesabı sunucuda açılır (B.4); e-posta ve şifreyle giriş yapıp
  **Yönetim** menüsüne girilir (`/admin`).
- **Görüntüleme hesabı:** "salt okunur" olarak açılan hesap paneli gezer
  ama hiçbir kaydı ekleyemez, değiştiremez, silemez. Müşteri incelemesi
  için düşünüldü.

### A.2 Menü

| Bölüm | Ekran | Ne yapılır |
|-----|-------|----------------|
| Genel Bakış | **Kontrol Paneli** | Kullanıcı, randevu, gelir, bekleyen iş sayıları; acil uyarılar (doğrulama bekleyen doktor, şikâyet edilen içerik, açık destek talebi) |
| Operasyon | **Doğrulama Merkezi** | Doktor ve klinik doğrulama başvuruları: belgeleri aç, **Onayla / Reddet** (gerekçe yazılır). Onaylanmayan doktora randevu alınamaz |
| | **Kullanıcı Yönetimi** | Sekmeler: Tümü / Doktorlar / Hastalar / Klinikler. Ara, süz, **engelle / engeli kaldır**, **parolayı sıfırla**, rol ve doğrulama durumunu gör |
| | **Finans** | Fatura ve gelir özeti, dönem raporu, dışa aktar |
| Moderasyon | **Yorum Moderasyonu** | Bekleyen / onaylı / reddedilen / gizli; doktor ve klinik yorumları ayrı |
| | **İçerik Moderasyonu** | Şikâyet edilen gönderi ve yorumlar: gizle, sil, şikâyeti kapat |
| Sistem | **Katalog Yönetimi** | Branşlar, tedaviler, semptom eş anlamlıları (halk dili → branş), şehir / ülke |
| | **Sistem Ayarları** | Site ayarları, özellik anahtarları: modül aç / kapat |
| | **Denetim Kayıtları** | Kim, ne zaman, neyi değiştirdi; tarih ve kullanıcıya göre süz |
| | **Destek Talepleri** | Kullanıcı destek talepleri; yanıtla, kapat |
| | **Duyurular** | Rol bazlı duyuru (hasta / doktor / klinik / hepsi), öncelik, kapatılabilir mi, aktif / pasif |

### A.3 Roller

| Rol | Not |
|------|------------|
| Hasta | Kayıtta e-posta doğrulaması |
| Doktor | E-posta doğrulaması + yönetici doğrulaması (belge) |
| Klinik | Kayıtta otomatik doğrulanır; CRM paketiyle CRM açılır |
| Hastane / grup | Otomatik doğrulanır; CRM her zaman açık; şubelerini yönetir |
| Yönetici | Tam yetki; salt-okunur türevi yalnız görüntüler |

### A.4 Günlük işleyiş önerisi
1. Kontrol panelindeki uyarıları sıfırlayın: bekleyen doğrulama, şikâyet,
   destek.
2. Yorum moderasyonunda bekleyenleri geçirin. Yalnız randevusu tamamlanmış
   hasta yorum yazabildiği için sahte yorum beklenmez; yine de içerik
   denetimi gerekir.
3. Haftada bir denetim kayıtlarını gözden geçirin.

---

## B. İşletme

### B.1 Bileşenler ve nerede çalıştıkları

| Bileşen | Yer | Not |
|--------|--------|--------|
| Ön yüz (Next.js) | Vercel — `med-gama.vercel.app` | `main` dalına push → otomatik yayın |
| Arka uç (Laravel 11) | Render — `medagama-backend.onrender.com` | Docker; ortam değişkenleri Render panelinden |
| Veritabanı | TiDB Cloud (MySQL uyumlu) | Yerelde PostgreSQL / MySQL, testte SQLite |
| Görüşme sinyal + TURN | OVH sunucu `57.128.27.244` | soketi (Docker) + coturn, TLS |
| Alt yazı motoru + çeviri | OVH sunucu, Docker | `deploy/stt/README.md` |
| Hasta dosyaları | Arka uç diski, şifreli | Buluta taşınması depolama hesabına bağlı (tutanak §3.5) |

### B.2 Yayın (deploy)
- Ön yüz: `git push origin <dal>:main` → Vercel derler (2–4 dk). Push
  öncesi yerelde `npm run build` yeşil olmalı.
- Arka uç: aynı push Render'ı tetikler (derleme 5–10 dk); konteyner
  açılışında göçler koşar. Göç gerekiyorsa Render konsolundan
  `php artisan migrate --force`.
- Geri alma: `docs/GERI-ALMA-PLANI.md`.

### B.3 Ortam değişkenleri (Render)
Tam liste `docs/PRODUCTION_DEPLOYMENT.md`. Bu teslimle eklenenler:

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
TiDB Cloud'da; dosya yedeği bulut depolama bağlanınca tamamlanır.

### B.6 İleride yapılacaklar

| Ne zaman | Ne yapılır |
|--|--|
| Alan adı bağlanınca | Vercel'e alan adı; e-posta servisinde alan adı doğrulaması (`docs/Medagama_Eposta_Secenekleri.pdf`); OVH sertifikası ve `REVERB_HOST` / `TURN_URLS` / `CAPTIONS_WHISPER_URL` / `LIBRETRANSLATE_URL` yeni alan adına |
| 8 Kasım 2026'dan önce | Alan adı hâlâ yoksa OVH geçici sertifikasını yenileyin |
| GPU sunucu gelince | Alt yazı motorunu büyük modele taşıyın (`deploy/stt/README.md`) |
| Bulut depolama hesabı gelince | Hasta dosyalarını ve yedekleri buluta taşıyın (`docs/PRODUCTION_DEPLOYMENT.md`) |

### B.7 Sağlık kontrolleri
```bash
curl -s https://medagama-backend.onrender.com/api/health          # ok
curl -s https://57-128-27-244.sslip.io/stt/health                   # {"ok":true,...}
curl -s https://57-128-27-244.sslip.io/lt/languages | head -c 100  # çeviri
```
Olay yönetimi: `docs/SECURITY_INCIDENT_RUNBOOK.md`.

### B.8 Testler
```bash
cd backend && php artisan test                 # arka uç
npm run test:unit                               # ön yüz birim ölçütleri
E2E_BASE_URL=... E2E_API_ORIGIN=... E2E_DEMO_KEY=... npx playwright test   # tarayıcı
```
Ayrıntı ve son sonuçlar: `TEST-RAPORU.pdf`. API dokümanı:
`backend/docs/openapi.yaml`.
