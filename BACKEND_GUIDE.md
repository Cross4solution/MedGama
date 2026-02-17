# MedGama — Backend Geliştirici Rehberi

> **Son Güncelleme:** 17 Şubat 2026  
> **Proje:** MedGama — Dijital Sağlık Platformu  
> **Backend Altyapı:** Mindbricks (Node.js, otomatik kod üretimi)  
> **Frontend:** React 19 + TailwindCSS (ayrı repo/dizin)

---

## 1. Genel Bakış

MedGama, hastaları doktorlar ve kliniklerle buluşturan kapsamlı bir dijital sağlık platformudur. Backend altyapısı **Mindbricks** platformu üzerinden otomatik olarak üretilmiş ve deploy edilmiştir.

### Mimari Şema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│              Vercel'de deploy — medgama.com               │
└──────────┬──────────┬──────────┬──────────┬─────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌───────┐ ┌────────────────┐
│ Auth API │ │Catalog │ │MedStr.│ │ ProviderCRM    │
│          │ │  API   │ │  API  │ │     API        │
└────┬─────┘ └───┬────┘ └──┬────┘ └───────┬────────┘
     │           │         │              │
     ▼           ▼         ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                   PostgreSQL + Redis                      │
│              ElasticSearch (BFF aggregation)               │
└──────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────┐          ┌────────────────────┐
│ Bookmarking API  │          │ Notification Svc   │
│                  │          │ (Email/SMS/Push)    │
└──────────────────┘          └────────────────────┘
```

---

## 2. Servis Haritası

Tüm servisler Mindbricks tarafından üretilmiş Node.js microservice'lerdir.

| # | Servis | Port | URL Pattern | Veritabanı | Açıklama |
|---|--------|------|-------------|------------|----------|
| 1 | **Auth Service** | — | `*/auth-api` | `med-auth-service` (PG) | Kullanıcı yönetimi, JWT, roller, doğrulama |
| 2 | **Catalog Service** | 3001 | `*/catalog-api` | `med-catalog-service` (PG) | Uzmanlıklar, şehirler, hastalıklar, semptom eşleme |
| 3 | **MedStream Service** | 3002 | `*/medstream-api` | `med-medstream-service` (PG) | Sosyal feed: postlar, yorumlar, beğeniler, raporlar |
| 4 | **ProviderCRM Service** | 3003 | `*/providercrm-api` | `med-providercrm-service` (PG) | Randevular, takvim, anamnez, hasta kayıtları, CRM |
| 5 | **Bookmarking Service** | 3005 | `*/bookmarking-api` | `med-bookmarking-service` (PG) | Favori doktor/klinik/post kaydetme |
| 6 | **BFF Service** | 3000 | — | ElasticSearch | Aggregation, Kafka event listener, zenginleştirilmiş view'lar |
| 7 | **Notification Service** | 3000 | — | PostgreSQL | Email/SMS/Push bildirimler (SendGrid, Twilio, FCM) |

### Environment URL'leri

| Ortam | Base URL |
|-------|----------|
| **Preview** | `https://med.prw.mindbricks.com/{servis}-api` |
| **Staging** | `https://med-stage.mindbricks.co/{servis}-api` |
| **Production** | `https://med.mindbricks.co/{servis}-api` |

### Her Servisin Standart Endpoint'leri

| Endpoint | Açıklama |
|----------|----------|
| `/` | API Test Arayüzü |
| `/swagger` | Swagger Dökümantasyonu |
| `/getPostmanCollection` | Postman Collection İndirme |
| `/health` | Sağlık Kontrolü |
| `/currentuser` | Aktif Oturum Bilgisi |

> **İlk Adım:** Her servisin `/swagger` endpoint'ini tarayıcıda aç ve API'leri incele.

---

## 3. Authentication (Kimlik Doğrulama)

### 3.1 Genel Akış

```
1. Kullanıcı → POST /auth-api/login (email + password)
2. Auth Service → JWT token döner
3. Frontend → JWT'yi localStorage'da saklar
4. Frontend → Her API isteğinde Authorization: Bearer <JWT> gönderir
5. Resource Service → JWT'yi doğrular (public key ile)
```

### 3.2 JWT Token Yapısı

```json
{
  "keyId": "716a8738ec3d499f84d58bda6ee772ce",
  "sessionId": "9cf23fa8-07d4-4e7c-80a6-ec6d6ac96bb9",
  "userId": "d92b9d4c-9b1e-4e95-842e-3fb9c8c1df38",
  "sub": "d92b9d4c-9b1e-4e95-842e-3fb9c8c1df38",
  "loginDate": "2023-10-01T12:00:00Z"
}
```

- **İmzalama:** RSA private key
- **Doğrulama:** `GET /auth-api/publickey?keyId=[keyIdInToken]`
- **Key rotation:** Otomatik (eski key'ler belirli süre geçerli kalır)

### 3.3 Roller (RBAC)

```javascript
const ROLES = {
  superAdmin:  "superAdmin",   // Platform yöneticisi — tam yetki
  saasAdmin:   "saasAdmin",    // SaaS seviye admin
  tenantOwner: "tenantOwner",  // Klinik sahibi (otomatik)
  tenantAdmin: "tenantAdmin",  // Klinik admin
  tenantUser:  "tenantUser",   // Klinik çalışanı (varsayılan)
  patient:     "patient",      // Hasta
  doctor:      "doctor",       // Doktor
  clinicOwner: "clinicOwner"   // Klinik sahibi (custom)
};
```

### 3.4 Super Admin

| Alan | Değer |
|------|-------|
| Email | `admin@admin.com` |
| userId | `f7103b85-fcda-4dec-92c6-c336f71fd3a2` |
| roleId | `superAdmin` |

### 3.5 Kayıt ve Doğrulama Akışları

```
HASTA KAYIT:
  1. POST /auth-api/register → { email, password, fullname, mobile, roleId: "patient" }
  2. Email doğrulama kodu gönderilir (byCode, 86400s geçerli)
  3. Mobil doğrulama kodu gönderilir (byCode, 300s geçerli)
  4. Her iki doğrulama tamamlanınca giriş yapılabilir

DOKTOR KAYIT:
  1. POST /auth-api/register → { email, password, fullname, mobile, roleId: "doctor" }
  2. Email + Mobil doğrulama (aynı akış)
  3. Admin tarafından isVerified: true yapılır

KLİNİK KAYIT:
  ⚠️ Public değil — Admin tarafından oluşturulur
  1. Admin → Klinik oluşturur (tenant)
  2. Klinik sahibi kullanıcısı oluşturulur
  3. Klinik sahibi kendi staff'ını ekleyebilir
```

### 3.6 Doğrulama Servisleri

| Servis | Yöntem | Tekrar Gönderme | Geçerlilik |
|--------|--------|-----------------|------------|
| Email Doğrulama | byCode | 60 sn | 24 saat |
| Mobil Doğrulama | byCode | 60 sn | 5 dk |
| Şifre Sıfırlama (Email) | byCode | 60 sn | 24 saat |
| Şifre Sıfırlama (Mobil) | byCode | 60 sn | 5 dk |
| Email 2FA | byCode (opsiyonel) | 60 sn | 24 saat |
| Mobil 2FA | byCode (opsiyonel) | 60 sn | 5 dk |

---

## 4. Veri Modelleri (Data Objects)

### Ortak Özellikler (Tüm Tablolar)

Her tablo otomatik olarak şu alanları içerir:
- `id` — UUID primary key
- `isActive` — Boolean (soft delete: false = silinmiş)
- `createdAt` — Timestamp
- `updatedAt` — Timestamp

---

### 4.1 Auth Service — `user` Tablosu

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `email` | String | ✅ | E-posta (klinik bazında unique) |
| `password` | String | ✅ | Hash'lenmiş şifre |
| `fullname` | String | ✅ | Ad soyad |
| `avatar` | String | — | Otomatik Gravatar üretilir |
| `roleId` | String | ✅ | Varsayılan: `tenantUser` |
| `mobile` | String | ✅ | Telefon numarası |
| `mobileVerified` | Boolean | ✅ | Varsayılan: `false` |
| `emailVerified` | Boolean | ✅ | Varsayılan: `false` |
| `cityId` | Integer | — | Şehir FK (catalog service) |
| `countryId` | Integer | — | Ülke FK |
| `dateOfBirth` | Date | — | Doğum tarihi |
| `gender` | Enum | — | `male` / `female` / `other` |
| `isVerified` | Boolean | — | Doktor/klinik onay durumu |
| `lastLogin` | Date | — | Son giriş |
| `clinicId` | ID | ✅ | Tenant ID (sabit, değiştirilemez) |

**Sabit alanlar (oluşturulduktan sonra değişmez):** `email`, `clinicId`  
**Otomatik avatar:** `https://gravatar.com/avatar/${md5(email)}?s=200&d=identicon`  
**Composite unique index:** `[clinicId, email]`

---

### 4.2 Auth Service — `clinic` Tablosu (Tenant)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `name` | String | ✅ | Kısa ad |
| `codename` | String | ✅ | Unique URL-friendly kod (otomatik) |
| `fullname` | String | ✅ | Tam ad |
| `avatar` | String | — | Otomatik Gravatar |
| `ownerId` | ID | ✅ | Sahibi (user.id → sabit) |
| `address` | String | — | Fiziksel adres |
| `biography` | Text | — | Klinik açıklaması |
| `mapCoordinates` | GeoPoint | — | Harita koordinatları |
| `website` | String | — | Web sitesi URL |

**Tenant API'leri:**
- `GET /briefclinics` — Public liste
- `GET /briefclinics/:codename` — Public detay
- `GET /clinichome/:codename` — Public ana sayfa
- `GET /clinics` — Giriş yapmış kullanıcı (kendi kliniği)
- `GET /clinicprofile` — Klinik yöneticisi
- `GET /clinicaccounts/:clinicId` — SaaS admin

---

### 4.3 ProviderCRM Service — Tablolar

#### `appointment` — Randevular

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `patientId` | ID | ✅ | Hasta |
| `doctorId` | ID | ✅ | Doktor |
| `clinicId` | ID | — | Klinik (varsa) |
| `appointmentType` | Enum | ✅ | `inPerson` / `online` |
| `slotId` | ID | — | Bağlı takvim slotu |
| `appointmentDate` | Date | ✅ | Tarih |
| `appointmentTime` | String | ✅ | Saat |
| `status` | Enum | ✅ | `pending` / `confirmed` / `cancelled` / `completed` |
| `confirmationNote` | String | — | Onay notu |
| `videoConferenceLink` | String | — | Video link (Phase 2 placeholder) |
| `doctorNote` | Text | — | Doktor özel notu |
| `createdBy` | ID | ✅ | Oluşturan kullanıcı (session'dan) |

#### `calendarSlot` — Takvim Slotları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `doctorId` | ID | ✅ | Doktor |
| `clinicId` | ID | — | Klinik |
| `slotDate` | Date | ✅ | Tarih |
| `startTime` | String | ✅ | Başlangıç saati |
| `durationMinutes` | Integer | ✅ | Süre (dk) — Varsayılan: 30 |
| `isAvailable` | Boolean | ✅ | Müsait mi? — Varsayılan: true |

**Unique index:** `[doctorId, slotDate, startTime]`

#### `digitalAnamnesis` — Dijital Anamnez

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `patientId` | ID | ✅ | Hasta |
| `doctorId` | ID | — | Güncelleyen doktor |
| `clinicId` | ID | — | Güncelleyen klinik |
| `answers` | Object (JSON) | ✅ | Anamnez cevapları |
| `lastUpdatedBy` | ID | — | Son güncelleyen |

**Unique index:** `[patientId]` (hasta başına tek anamnez)

#### `patientRecord` — Hasta Dosyaları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `patientId` | ID | ✅ | Hasta |
| `clinicId` | ID | — | Klinik |
| `doctorId` | ID | — | Doktor |
| `fileUrl` | String | ✅ | Dosya URL'i (S3/harici depolama) |
| `uploadDate` | Date | — | Yükleme tarihi |
| `recordType` | Enum | ✅ | `labResult` / `report` / `scan` / `other` |
| `description` | String | — | Açıklama |

> ⚠️ **Dosyalar veritabanında saklanmaz.** Sadece URL referansları tutulur. Dosyalar S3 veya benzeri harici depolamada olmalıdır.

#### `crmTag` — CRM Etiketleri

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `doctorId` | ID | ✅ | Etiketi oluşturan doktor |
| `patientId` | ID | ✅ | Etiketlenen hasta |
| `clinicId` | ID | — | Klinik bağlamı |
| `tag` | String | ✅ | Etiket metni |
| `createdBy` | ID | ✅ | Oluşturan (session'dan) |

#### `crmProcessStage` — CRM Süreç Aşamaları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `doctorId` | ID | ✅ | Doktor |
| `patientId` | ID | ✅ | Hasta |
| `clinicId` | ID | — | Klinik |
| `stage` | String | ✅ | Aşama adı (ör: "Yeni Hasta", "Ameliyat Sonrası") |
| `startedAt` | Date | — | Başlangıç tarihi |
| `updatedBy` | ID | — | Güncelleyen |

#### `archivedClinicRecord` — Arşivlenmiş Klinik Kayıtları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `formerDoctorId` | ID | ✅ | Ayrılan doktor |
| `clinicId` | ID | ✅ | Klinik |
| `archivedPatientId` | ID | ✅ | Hasta |
| `recordReferences` | Object (JSON) | — | patientRecord ID'leri dizisi |
| `archivedAt` | Date | — | Arşivleme tarihi |

> Doktor klinikten ayrıldığında, hasta kayıtları klinik adına arşivlenir. Klinik sahibi bu kayıtlara erişmeye devam eder.

---

### 4.4 MedStream Service — Tablolar

#### `medStreamPost` — Feed Gönderileri

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `authorId` | ID | ✅ | Yazar (session'dan, sabit) |
| `clinicId` | ID | — | Klinik adına paylaşım |
| `postType` | Enum | ✅ | `text` / `image` / `video` |
| `content` | Text | — | Metin içeriği |
| `mediaUrl` | String | — | Görsel/video URL |
| `isHidden` | Boolean | — | Moderasyon ile gizlenmiş mi |

> ⚠️ **Sadece doctor ve clinicOwner rolleri post oluşturabilir.** Bu kural business logic'te enforce edilmeli.

#### `medStreamComment` — Yorumlar

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `postId` | ID | ✅ | Hedef post |
| `authorId` | ID | ✅ | Yazar (session'dan) |
| `content` | Text | ✅ | Yorum metni |
| `isHidden` | Boolean | — | Moderasyon |

#### `medStreamLike` — Beğeniler

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `postId` | ID | ✅ | Hedef post |
| `userId` | ID | ✅ | Beğenen (session'dan) |

**Unique index:** `[userId, postId]` — Kullanıcı başına tek beğeni

#### `medStreamBookmark` — Yer İmleri

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `userId` | ID | ✅ | Kullanıcı |
| `bookmarkedType` | Enum | ✅ | `post` / `doctor` / `clinic` / `patient` |
| `targetId` | ID | ✅ | Hedef ID |

#### `medStreamReport` — İçerik Raporları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `postId` | ID | ✅ | Raporlanan post |
| `reporterId` | ID | ✅ | Raporlayan (session'dan) |
| `reason` | String | ✅ | Sebep |
| `adminStatus` | Enum | ✅ | `pending` / `reviewed` / `hidden` / `deleted` |

#### `medStreamEngagementCounter` — Etkileşim Sayaçları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `postId` | ID | ✅ | Post (unique) |
| `likeCount` | Integer | ✅ | Varsayılan: 0 |
| `commentCount` | Integer | ✅ | Varsayılan: 0 |

> Redis cache ile hızlandırılmış. Smart caching: ilk erişimde cache'lenir, 15 dk TTL.

---

### 4.5 Catalog Service — Tablolar

#### `specialty` — Uzmanlık Alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `code` | String | ✅ | Unique kod (ör: `CARD`, `ENDO`) |
| `displayOrder` | Integer | ✅ | Sıralama (varsayılan: 100) |
| `translations` | Object | ✅ | `{"en":"Cardiology","tr":"Kardiyoloji"}` |

#### `city` — Şehirler

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `code` | String | ✅ | Şehir kodu (ör: `IST`, `NYC`) |
| `countryId` | Integer | ✅ | Ülke ID |
| `translations` | Object | ✅ | `{"en":"Istanbul","tr":"İstanbul"}` |

**Unique index:** `[countryId, code]`

#### `diseaseCondition` — Hastalıklar/Durumlar

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `code` | String | ✅ | Unique kod (ör: `DIAB`, `ASTHMA`) |
| `recommendedSpecialtyIds` | ID[] | — | Önerilen uzmanlık ID'leri |
| `translations` | Object | ✅ | `{"en":"Diabetes","tr":"Diyabet"}` |

#### `symptomSpecialtyMapping` — Semptom-Uzmanlık Eşleme

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `symptom` | String | ✅ | Semptom kodu (ör: `cough`, `rash`) |
| `specialtyIds` | ID[] | ✅ | İlgili uzmanlık ID'leri |
| `translations` | Object | ✅ | `{"en":"Cough","tr":"Öksürük"}` |

---

### 4.6 Bookmarking Service — `userBookmark`

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `targetId` | ID | ✅ | Hedef entity ID |
| `targetType` | Enum | ✅ | `doctor` / `clinic` / `patient` / `medStreamPost` |
| `userId` | ID | ✅ | Kullanıcı (session'dan) |

**Unique index:** `[userId, targetType, targetId, isActive]`

---

## 5. Bildirim Sistemi (Notifications)

### 5.1 Tanımlı Bildirim Tipleri

| Bildirim | Tetikleyici | Alıcılar |
|----------|-------------|----------|
| `patientRegistrationWelcome` | Hasta hesap doğrulandı | patient |
| `doctorRegistrationVerified` | Doktor doğrulandı | doctor |
| `clinicRegistrationApproved` | Klinik admin tarafından onaylandı | clinicOwner |
| `appointmentBooked` | Randevu oluşturuldu (pending) | doctor, clinicOwner |
| `appointmentConfirmed` | Randevu onaylandı | patient |
| `appointmentCancelled` | Randevu iptal edildi | patient, doctor, clinicOwner |
| `appointmentReminder` | Randevu X saat önce | patient |
| `medStreamContentReported` | Post raporlandı | admin |
| `medStreamPostModerated` | Post gizlendi/silindi | doctor, clinicOwner |

### 5.2 Bildirim Kanalları

| Kanal | Provider Seçenekleri |
|-------|---------------------|
| **Email** | SendGrid, SMTP, Amazon SES |
| **SMS** | Twilio, NetGSM, Vonage, Amazon SNS |
| **Push** | Firebase (FCM), OneSignal, Amazon SNS |

### 5.3 Kafka Event Topic'leri

```
<codename>-notification-email
<codename>-notification-push
<codename>-notification-sms
```

---

## 6. Mindbricks'in Sağladığı vs. Senin Yazman Gereken

### ✅ Mindbricks Otomatik Sağlıyor

- Tüm CRUD API'ler (create, read, update, delete, list)
- Database şemaları ve migration'lar
- JWT authentication middleware
- Soft delete mekanizması
- ElasticSearch indexleme
- Redis entity caching
- M2M (servisler arası) endpoint'ler
- Swagger dökümantasyonu
- Postman collection'lar
- Health check endpoint'leri

### 🔨 Backend Geliştiricinin Yazması Gereken

#### Öncelik 1 — Kritik (İlk Sprint)

| İş | Açıklama | Servis |
|----|----------|--------|
| **Hook Functions** | Tüm servislerde "No hook functions defined" — iş mantığı hook'ları yazılmalı | Tümü |
| **Randevu iş mantığı** | Randevu iptalinde slot'u tekrar available yap, çakışma kontrolü | ProviderCRM |
| **Role validation** | Post oluşturmada sadece doctor/clinicOwner kontrolü | MedStream |
| **Engagement counter sync** | Like/comment'te counter güncelleme logic'i | MedStream |
| **Notification trigger'ları** | Hangi event'te hangi bildirim gönderilecek — Kafka bağlantıları | Notification |
| **Email/SMS provider config** | SendGrid API key, Twilio credentials vb. | Notification |

#### Öncelik 2 — Yüksek (İkinci Sprint)

| İş | Açıklama | Servis |
|----|----------|--------|
| **S3 file upload** | Hasta dosyaları için pre-signed URL üretimi | ProviderCRM |
| **Clinic archival logic** | Doktor ayrıldığında kayıtları arşivleme | ProviderCRM |
| **Admin moderation flow** | Report → review → hide/delete akışı | MedStream |
| **Catalog seed data** | Uzmanlıklar, şehirler, hastalıklar için başlangıç verisi | Catalog |
| **Symptom-specialty mapping** | Semptom-uzmanlık eşleme verisi | Catalog |

#### Öncelik 3 — Orta (Üçüncü Sprint)

| İş | Açıklama | Servis |
|----|----------|--------|
| **GDPR data deletion** | Kullanıcı veri silme workflow'u | Auth + tüm servisler |
| **Audit logging** | Kişisel veri erişim/değişiklik logları | Tümü |
| **Rate limiting** | API abuse koruması | Tümü |
| **Cron: appointment reminders** | Randevu hatırlatıcı zamanlayıcı | ProviderCRM + Notification |
| **Cron: data retention** | Süresi dolan verilerin temizliği | Tümü |

---

## 7. M2M (Machine-to-Machine) Endpoint'ler

Her servis, diğer servislerden çağrılabilecek M2M endpoint'leri sunar. Bunlar **login gerektirmez** ve servisler arası iletişim içindir.

### Pattern

```
POST   /m2m/{objectName}/create
POST   /m2m/{objectName}/bulk-create
PUT    /m2m/{objectName}/update/:id
DELETE /m2m/{objectName}/delete/:id
PUT    /m2m/{objectName}/update-by-query
DELETE /m2m/{objectName}/delete-by-query
PUT    /m2m/{objectName}/update-by-id-list
```

### Örnek: ProviderCRM M2M

```
POST   /m2m/appointment/create
POST   /m2m/appointment/bulk-create
PUT    /m2m/appointment/update/:id
DELETE /m2m/appointment/delete/:id
POST   /m2m/calendarslot/create
POST   /m2m/digitalanamnesis/create
POST   /m2m/patientrecord/create
POST   /m2m/crmtag/create
POST   /m2m/crmprocessstage/create
POST   /m2m/archivedclinicrecord/create
```

> ⚠️ **Güvenlik:** M2M endpoint'leri login gerektirmez. Bunları sadece internal network'ten erişilebilir yapın veya API key ile koruyun.

---

## 8. Multi-Tenancy (Çoklu Kiracılık)

MedGama **clinic = tenant** modelini kullanır.

### Kurallar

1. Her kullanıcının bir `clinicId`'si vardır (oluşturulduktan sonra değişmez)
2. `clinicId: 00000000-0000-0000-0000-000000000000` → Root/SaaS seviye kullanıcı
3. Klinik bazında veri izolasyonu sağlanır
4. Klinik sahibi, kliniğe bağlı TÜM verilere erişebilir (eski doktor kayıtları dahil)
5. Doktor klinikten ayrıldığında kayıtları `archivedClinicRecord` olarak saklanır

### Tenant Oluşturma Akışı

```
1. SaaS Admin → Klinik oluşturur (POST /clinicaccounts)
2. Klinik sahibi kullanıcısı oluşturulur (roleId: clinicOwner)
3. Klinik sahibi → Staff ekler (roleId: doctor veya tenantUser)
4. Staff kullanıcıları otomatik olarak clinicId ile ilişkilendirilir
```

---

## 9. Soft Delete Stratejisi

Tüm servislerde soft delete aktiftir:

```sql
-- Silme: isActive = false yapılır
UPDATE appointments SET "isActive" = false WHERE id = '...';

-- Listeleme: Sadece aktif kayıtlar gelir
SELECT * FROM appointments WHERE "isActive" = true;
```

> Fiziksel silme yapılmaz. GDPR veri silme talepleri için özel bir workflow gerekir.

---

## 10. Hızlı Başlangıç Checklist'i

Backend geliştirici olarak ilk yapman gerekenler:

### Gün 1: Keşif
- [ ] Preview URL'lerini tarayıcıda aç ve test et
- [ ] Her servisin `/swagger` sayfasını incele
- [ ] Postman collection'ları indir (`/getPostmanCollection`)
- [ ] Super admin ile giriş yap ve token al
- [ ] Token ile birkaç API çağrısı test et

### Gün 2-3: Temel Konfigürasyon
- [ ] Environment variable'ları ayarla (SendGrid, Twilio, S3 vb.)
- [ ] Catalog seed data'sını yükle (uzmanlıklar, şehirler)
- [ ] Symptom-specialty mapping verisi gir
- [ ] Test kullanıcıları oluştur (patient, doctor, clinicOwner)

### Gün 4-5: Hook Functions
- [ ] Randevu oluşturma hook'u (slot availability kontrolü)
- [ ] Randevu iptal hook'u (slot'u tekrar available yap)
- [ ] MedStream post oluşturma hook'u (role validation)
- [ ] Like/comment hook'u (engagement counter güncelleme)

### Hafta 2: Bildirimler ve İş Mantığı
- [ ] Notification provider'ları konfigüre et
- [ ] Kafka event → notification bağlantılarını kur
- [ ] Randevu hatırlatıcı cron job'ı yaz
- [ ] Admin moderation workflow'unu implement et

### Hafta 3: Güvenlik ve Compliance
- [ ] M2M endpoint'lerini güvenli hale getir
- [ ] Rate limiting ekle
- [ ] GDPR veri silme workflow'u
- [ ] Audit logging

---

## 11. Sık Sorulan Sorular

**S: Mindbricks kodlarını nerede düzenlerim?**  
C: Mindbricks platformu üzerinden. Hook functions, edge functions ve library functions Mindbricks arayüzünden yazılır. Alternatif olarak, custom bir servis yazıp M2M endpoint'leri üzerinden mevcut servislerle iletişim kurabilirsin.

**S: Veritabanına doğrudan erişebilir miyim?**  
C: Evet, PostgreSQL bağlantı bilgileri environment variable'lardan alınır. Ancak Mindbricks'in ORM katmanını bypass etmek önerilmez — soft delete, caching ve indexleme bozulabilir.

**S: Yeni bir tablo/alan ekleyebilir miyim?**  
C: Mindbricks platformundan data object tanımı güncelleyerek. Manuel migration yazmak yerine Mindbricks'in code generation'ını kullan.

**S: Frontend ile nasıl iletişim kuracağız?**  
C: Frontend, JWT token ile doğrudan Mindbricks API'lerine istek atar. Arada bir proxy/gateway yok. CORS ayarları Mindbricks'te yapılır.

**S: Test ortamı var mı?**  
C: Preview (`med.prw.mindbricks.com`) ve Staging (`med-stage.mindbricks.co`) ortamları mevcut. Production'a dokunmadan test yapılabilir.

---

## 12. İletişim ve Kaynaklar

| Kaynak | URL |
|--------|-----|
| Preview Auth API | `https://med.prw.mindbricks.com/auth-api/swagger` |
| Preview Catalog API | `https://med.prw.mindbricks.com/catalog-api/swagger` |
| Preview MedStream API | `https://med.prw.mindbricks.com/medstream-api/swagger` |
| Preview ProviderCRM API | `https://med.prw.mindbricks.com/providercrm-api/swagger` |
| Preview Bookmarking API | `https://med.prw.mindbricks.com/bookmarking-api/swagger` |
| Mindbricks Docs | Platform içi dökümantasyon |
| Frontend Repo | Bu repo (`/src` dizini — React) |

---

> **Not:** Bu döküman, Mindbricks servis tanımlarından derlenmiştir. API endpoint detayları için her servisin `/swagger` sayfasını referans alın.
