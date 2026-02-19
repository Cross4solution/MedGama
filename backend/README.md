# MedGama Backend API

Dijital sağlık ve randevu yönetim platformu. Laravel 11 tabanlı RESTful API.

---

## Proje Hakkında

MedGama, hastaları doktorlar ve kliniklerle buluşturan kapsamlı bir dijital sağlık platformudur.

**Temel Özellikler:**
- Hasta / Doktor / Klinik / Admin çoklu rol sistemi
- Online randevu oluşturma ve yönetimi (yüz yüze + video)
- MedStream sosyal sağlık akışı (post, yorum, beğeni, paylaşım)
- Gerçek zamanlı mesajlaşma (1:1 doktor-hasta chat)
- Dijital anamnez ve hasta kayıtları
- CRM paneli (doktor/klinik yönetimi)
- SuperAdmin paneli (platform yönetimi, doktor doğrulama, içerik moderasyonu)
- Bildirim sistemi (randevu hatırlatma, onay, iptal)
- GDPR uyumlu veri yönetimi
- Çoklu dil desteği (i18n — 10 dil)

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | Laravel 11 (PHP 8.4) |
| **Veritabanı** | PostgreSQL (UUID primary keys) |
| **Cache & Queue** | Redis |
| **Auth** | Laravel Sanctum (Bearer token) |
| **WebSocket** | Laravel Reverb |
| **Containerization** | Docker (nginx + php-fpm + supervisor) |
| **CI/CD** | Railway (backend) + Vercel (frontend) |

---

## Kurulum (Lokal Geliştirme)

### Gereksinimler
- PHP 8.4+
- Composer 2.x
- PostgreSQL 15+
- Redis 7+
- Node.js 18+ (frontend için)

### Adımlar

```bash
# 1. Repo'yu klonla
git clone https://github.com/Cross4solution/MedGama.git
cd MedGama/backend

# 2. Bağımlılıkları yükle
composer install

# 3. Environment dosyasını oluştur
cp .env.example .env

# 4. .env dosyasını düzenle (DB, Redis bağlantı bilgileri)
# Minimum: DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 5. Uygulama anahtarı oluştur
php artisan key:generate

# 6. Veritabanını oluştur ve seed et
php artisan migrate --seed

# 7. Sunucuyu başlat
php artisan serve --port=8001

# 8. (Opsiyonel) Queue worker başlat
php artisan queue:work redis --sleep=3 --tries=3

# 9. (Opsiyonel) WebSocket sunucusu başlat
php artisan reverb:start --host=0.0.0.0 --port=6001
```

### Seed Sonrası Hazır Hesaplar

| Rol | Email | Şifre |
|-----|-------|-------|
| **Admin** | admin@admin.com | admin123 |
| **Klinik** | clinic@medgama.com | clinic123 |
| **Doktor** | doctor@medgama.com | doctor123 |
| **Hasta** | patient@medgama.com | patient123 |
| **Hasta 2** | zeynep@medgama.com | patient123 |

---

## Environment Değişkenleri

`.env.example` dosyasında tüm değişkenler açıklamalı olarak bulunur. Kritik olanlar:

| Değişken | Açıklama |
|----------|----------|
| `APP_KEY` | `php artisan key:generate` ile oluştur |
| `APP_DEBUG` | Production'da **false** olmalı |
| `DATABASE_URL` | Railway otomatik sağlar |
| `REDIS_URL` | Railway otomatik sağlar |
| `CORS_ALLOWED_ORIGINS` | Frontend domain (virgülle ayrılmış) |
| `MAIL_MAILER` | `log` = demo modu, `smtp` = gerçek mail |
| `REVERB_APP_KEY` | WebSocket auth key |
| `REVERB_APP_SECRET` | WebSocket auth secret |
| `SANCTUM_STATEFUL_DOMAINS` | Frontend domain (cookie auth için) |

---

## API Yapısı

Tüm API endpoint'leri `/api` prefix'i altındadır.

### Public (Auth gerektirmeyen)
| Grup | Prefix | Açıklama |
|------|--------|----------|
| Auth | `/api/auth` | Login, Register, Forgot Password |
| Catalog | `/api/catalog` | Uzmanlıklar, Şehirler, Hastalıklar |
| Doctors | `/api/doctors` | Doktor listesi ve profil |
| Clinics | `/api/clinics` | Klinik listesi ve detay |
| MedStream | `/api/medstream/posts` | Sosyal akış (okuma) |

### Protected (Bearer token gerekli)
| Grup | Prefix | Açıklama |
|------|--------|----------|
| Profile | `/api/auth/profile` | Profil güncelleme, avatar, şifre |
| Appointments | `/api/appointments` | Randevu CRUD |
| Calendar | `/api/calendar-slots` | Doktor takvim yönetimi |
| Messages | `/api/messages` | Mesajlaşma sistemi |
| Chat | `/api/chat` | Gerçek zamanlı 1:1 chat |
| Notifications | `/api/notifications` | Bildirim yönetimi |
| CRM | `/api/crm` | Doktor/klinik CRM |
| Analytics | `/api/analytics` | Klinik istatistikleri |
| Admin | `/api/admin` | Platform yönetimi |

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| Login | 5 istek/dakika/IP |
| Register | 3 istek/dakika/IP |
| Password Reset | 3 istek/dakika/IP |

---

## Mimari

```
app/
├── Console/Commands/        # Artisan komutları (hatırlatma gönderici vb.)
├── Http/
│   ├── Controllers/Api/     # API Controller'ları
│   ├── Middleware/           # CheckRole, CORS vb.
│   ├── Requests/            # Form Request validation sınıfları
│   └── Resources/           # API Resource (JSON dönüşüm) sınıfları
├── Mail/                    # Mailable sınıfları
├── Models/                  # Eloquent modelleri (UUID, SoftDeletes)
├── Notifications/           # Bildirim sınıfları (database + mail)
├── Providers/               # Service provider'lar
└── Services/                # İş mantığı (AuthService vb.)
```

**Tasarım Prensipleri:**
- **Service Layer**: İş mantığı Controller'lardan ayrılmış (`app/Services/`)
- **Form Requests**: Validation kuralları ayrı sınıflarda
- **API Resources**: Response formatı `UserResource`, `AppointmentResource` vb.
- **UUID Primary Keys**: Tüm tablolarda UUID kullanılır
- **Soft Deletes**: GDPR uyumlu — veriler silinmez, işaretlenir
- **Encrypted Fields**: Hassas tıbbi notlar `encrypted` cast ile saklanır

---

## Deploy (Railway)

### Otomatik Yapılandırma
Railway, `Dockerfile` üzerinden build eder. Deployment sırasında otomatik çalışan komutlar:
- `php artisan optimize` (config + route cache)
- `php artisan view:cache`
- `php artisan migrate --force`

### Railway Environment Variables
Railway UI'dan şu değişkenleri ayarla:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=base64:...`
- `CORS_ALLOWED_ORIGINS=https://med-gama.vercel.app`
- `FRONTEND_URL=https://med-gama.vercel.app`
- `MAIL_MAILER=log` (demo) veya `smtp` (production)

`DATABASE_URL` ve `REDIS_URL` Railway plugin'leri tarafından otomatik sağlanır.

### Supervisor Servisleri
Container içinde supervisor şu servisleri yönetir:
1. **nginx** — HTTP sunucu
2. **php-fpm** — PHP işlem yöneticisi
3. **queue-worker** — Arka plan iş kuyruğu
4. **reverb** — WebSocket sunucu (port 6001)
5. **scheduler** — Cron görevleri (her dakika)

---

## Frontend Entegrasyonu (Vercel)

Frontend React uygulaması Vercel'de host edilir.

**Önemli Frontend Env Değişkenleri (Vercel):**
```
REACT_APP_API_BASE=https://medgama-production.up.railway.app/api
```

**CORS Notu:** Backend'de `CORS_ALLOWED_ORIGINS` Vercel domain'ini içermeli ve `supports_credentials=true` olmalı.

---

## Güvenlik

- **Rate Limiting**: Login/Register brute-force koruması
- **Sanctum Token Auth**: Bearer token tabanlı API auth
- **CORS**: Sadece izin verilen origin'ler
- **Encrypted Fields**: Tıbbi notlar veritabanında şifreli
- **Production Error Handler**: Ham hata mesajları kullanıcıya gösterilmez
- **GDPR Compliance**: Soft delete, veri export, hesap silme
- **BCRYPT**: Şifreler 12 round hash ile saklanır

---

## Lisans

Bu proje özel (proprietary) bir projedir. Tüm hakları saklıdır.
