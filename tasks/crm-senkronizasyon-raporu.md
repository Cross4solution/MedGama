# CRM ↔ Ana Site Senkronizasyon Denetimi

Tarih: 2026-08-15 · Kapsam: 25 CRM ekranı, 8 CRM rota grubu, ilgili servisler

## Özet

CRM ayrı bir uygulama değil: aynı Laravel API'sine, aynı veritabanına ve aynı
oturuma bağlı. 25 ekranın **hepsi** gerçek API çağırıyor, hiçbirinde sahte
liste yok. Temel akış senkron.

Ama ana sitede son haftalarda değişen dört kural CRM'e taşınmamış. İkisi
uluslararası kullanımda yanlış bilgi gösteriyor, biri iki ekranın birbiriyle
çelişmesine yol açıyor, biri de müşteriye demo sırasında sahte veri gösteriyor.

## Senkron çalışan taraf

| Alan | Durum |
|---|---|
| Kimlik / rol / isPro | Aynı `AuthContext`, aynı `crm.access` middleware |
| Hasta listesi | Türetilmiş: randevusu olan hastalar otomatik düşüyor, elle kayıt yok |
| Randevular | Aynı `appointments` tablosu |
| Mesajlar | Aynı `messageAPI`, ana siteyle tek gelen kutusu |
| MedStream | CRM'den atılan gönderi ana akışta görünüyor |
| Belgeler | Aynı şifreli PHI deposu |
| Faturalar / gelir | Aynı `BillingService` + `FinanceService` |
| Yorumlar, lead, şube, personel | Gerçek API |
| Çok dillilik | 25 ekranın hepsinde `useTranslation` var |

## Bulgular

### 1. Saat dilimi CRM'e taşınmamış — YÜKSEK

Ana sitedeki randevu ekranları mutlak ana (`starts_at`) geçti. CRM hâlâ
`appointment_date` + `appointment_time` metin alanlarını okuyor:

- `src/screens/crm/CRMAppointments.jsx:67`
- `src/screens/crm/CRMSmartCalendar.jsx:486`
- `src/screens/crm/CRMTelehealth.jsx:405`

Sonuç: Almanya'daki bir doktor CRM'de "14:00" görüyor, hasta ise kendi
ekranında doğru saati görüyor. İki ekran aynı randevu için farklı saat söylüyor.

### 2. Randevu iş akışı iki ekranda çelişiyor — YÜKSEK

Ana site: hasta randevu alır → **doğrudan onaylı**, doktor 2 saat içinde
reddedebilir (`doctor_can_reject`, `DoctorAppointments.jsx:157`).

CRM: hâlâ eski model — "Bekleyen istekler" kuyruğu ve **Onayla** düğmesi
(`CRMAppointments.jsx:670, 905`). Doktor CRM'den bakınca onay bekleyen bir
randevu görüyor, oysa hasta tarafında randevu çoktan onaylı görünüyor.

### 3. CRM Ayarlar'da üç sekme dekoratif — YÜKSEK (demo riski)

`CRMSettings.jsx:384-400` — `clinic`, `notifications`, `schedule` durumları
sabit değerlerle başlıyor, sunucudan **hiç yüklenmiyor** ve **hiç
kaydedilmiyor**:

- Klinik bilgileri: "Medagama Health Center, Levent Mah. Buyukdere Cad. No:185"
- Bildirimler: 8 anahtar, ana sitedeki gerçek tercih kaydından bağımsız
- Çalışma programı: slot süresi, mola, çalışma günleri

Profil / çalışma saatleri / hizmetler / sosyal sekmeleri gerçek — sorun bu üçünde.

Ayrıca ana sitede gerçek bildirim tercihi API'si var
(`authAPI.getNotificationPrefs` / `updateNotificationPrefs`); CRM onu kullanmıyor.

### 4. CRM MedStream'de alt yazı yok — ORTA

Yeni eklenen alt yazı katmanı yalnızca ana akışta ve gönderi detayında.
CRM akışında CC düğmesi yok, doktor kendi videosunun alt yazısını CRM'den
düzeltemiyor — oysa doktorun günlük çalıştığı yer CRM.

### 5. Ödeme / kapora katmanı CRM'e bağlı değil — ORTA

`PaymentService` yalnızca kendi modeli ve `ExpireStalePayments` komutu içinde
geçiyor. CRM Gelir ve Fatura ekranları kaporaları görmüyor. Zaten müşterinin
tutar/komisyon/iade kararları beklendiği için şimdilik beklemesi normal.

## Önerilen sıra

1. Saat dilimi (1) ve randevu iş akışı (2) — aynı dosyalara dokunuyor, birlikte
2. CRM Ayarlar'ın üç sahte sekmesi (3) — ya gerçek API'ye bağlanır ya kaldırılır
3. CRM MedStream alt yazı (4)
4. Ödeme (5) — müşteri kararlarından sonra
