# Uygunluk Raporu — Gereksinim ve Kapsam Doğrulama

Bu rapor üç soruyu **ölçerek** yanıtlıyor: kod, yazılı kurallara uyuyor mu;
her özelliğin kabul ölçütü var mı; ve mevzuat gereksinimleri karşılanıyor mu.

Her satır ya bir deneyle ya bir kaynak okumasıyla doğrulandı. Doğrulanmamış
hiçbir şey "uyuyor" diye yazılmadı.

**Kaynaklar:** `docs/MASTER_BRIEF.md` (kendi ifadesiyle "tek gerçek kaynak"),
`.claude/CLAUDE.md`, `docs/Mevzuat_Uyum_Iletilmesi_Gerekenler.pdf`,
`docs/Mevzuat_Uyum_Saklama_Suresi.pdf`.

---

## 1. İş kuralları — brief'e uygunluk

| Brief'teki kural | Ölçüm | Sonuç |
|---|---|---|
| ICD-10 **kesinlikle kullanılmaz** | Veritabanında `icd` içeren sütun yok; tanı serbest metin (`diagnosis_note`) | ✅ uyuyor |
| S3 klinik randevu ve telehealth sunar | Klinik randevusu oluşturuluyor (HTTP 201); `doctor_id`, `clinic_id` varken zorunlu değil | ✅ uyuyor |
| S4 hastane **doğrudan randevu almaz** | Randevu isteği yalnız `doctor_id`/`clinic_id` kabul ediyor; hastane hedef olamıyor | ✅ uyuyor |
| CRM yalnız **ücretli abonelik** sahibi S2/S3/S4'te | `CheckCrmAccess` dört seviyeyi de `is_crm_active` + `crm_expires_at` ile denetliyor | ✅ uyuyor |
| Mapbox ile harita | `src/config/mapbox.js` + klinik profil düzenleme | ✅ uyuyor |
| Reverb ile anlık bildirim | `src/lib/echo.js` (laravel-echo) | ✅ uyuyor |
| **S2 bağımsız doktorun randevu/telehealth yetkisi YOK** | Kliniği olmayan doktora randevu **alınabiliyor (HTTP 201)** | ❌ **uymuyor** |
| Kurumsal renk `#7C3AED` | Kaynakta bu kod hiç geçmiyor | ⚠️ doğrulanamadı |

### ❌ Tek gerçek uyumsuzluk: bağımsız doktor randevusu

Brief: *"Seviye 2 — Sınır: Randevu alma veya Telehealth yetkisi yoktur."*

Ölçüm: `clinic_id` boş bir doktora randevu isteği **201** döndü.

**Bunu tek başıma düzeltmedim, çünkü sistemin geri kalanı bu özelliği var
sayıyor:**

- Tohum verisi doktora randevu açıyor
- Üç e2e dosyası doktor randevularını sınıyor
  (`randevu-doktor-islemleri`, `crm-randevular`, `randevular`)
- `CLAUDE.md` böyle bir kısıt yazmıyor
- Doktorun randevu onaylama/reddetme akışı kodda mevcut

Yani ya **brief eskimiş** ya da **çalışan bir özellik yanlışlıkla açılmış**.
İkisi de mümkün ve karar ürün sahibinin.

- **Brief geçerliyse:** bağımsız doktor randevu hedefi olamamalı; ilgili
  ekranlar, testler ve tohum verisi buna göre değişir.
- **Kod geçerliyse:** brief'in Seviye 2 maddesi güncellenmeli.

---

## 2. Kabul kriterleri

**Durum: yok.**

Depodaki ~1500 test, *bulunan kusurları ve gözlenen davranışı* sabitliyor.
Bu değerli ama farklı bir şey: "bu özellik şu koşulları sağlarsa kabul
edilir" diye önceden yazılmış bir ölçüt listesi bulunmuyor.

Pratik sonuç: bir özelliğin "bitti" sayılıp sayılmayacağına bakılacak yazılı
bir dayanak yok. Anlaşmazlık çıkarsa taraflar aynı belgeye bakamaz.

---

## 3. Mevzuat uyumu

### 3.1 Yapılmış olanlar (testli)

| Gereksinim | Karşılık |
|---|---|
| GDPR md. 15/20 — veri dışa aktarma | Profil, randevu, fatura, mesaj, değerlendirme, belge, rıza |
| GDPR md. 17 — silme | Yasal dayanağı olmayan içerik siliniyor; kimlik anonimleşiyor |
| GDPR md. 17(3)(b)/(h), KVKK md. 7 — saklama istisnası | Tıbbi kayıt ve fatura bilerek korunuyor |
| KVKK md. 6 — özel nitelikli veri şifreleme | Anamnez, muayene notu, tanı, sohbet, iletişim mesajı, belgeler |
| KVKK md. 12 — erişim kaydı | `health_data_audit_logs` |
| Rızanın kanıtlanabilirliği | `consent_records` (tür, sürüm, tarih, kaynak) |
| Saklama politikası md. 4 — silme denetim kaydına yazılır | `gdpr.account_deleted` denetim kaydı |

### 3.2 Saklama süreleri — dokümana karşı

Doküman: *"Sağlık verisinde kısa tutup silme değil, yasal asgari saklama
esastır; **erken silmek de ihlaldir**."*

| Doküman | Kodda | Sonuç |
|---|---|---|
| Hasta dosyası: TR **20 yıl** / AB 10 / ABD 6–10 | **10 yıl** (tüm tıbbi modeller) | ⚠️ TR pazarı için **kısa** |
| Görüntüleme / laboratuvar: TR 20 yıl | `PatientDocument` — budama **yok** | ⚠️ süresiz |
| Reçete: TR 5 yıl | budama **yok** | ⚠️ süresiz |
| Rıza formları: TR 20 yıl | `ConsentRecord` — budama **yok** | ⚠️ süresiz |
| Çocuk hasta: 18 yaş + | yok | ❌ uygulanmamış |
| Süre **son işlem/ziyaret** tarihinden işler | `deleted_at`'ten işliyor | ⚠️ farklı başlangıç |
| Süre boyunca **erişimi kısıtlı arşivde** tutulur | kayıtlar normal görünürlükte | ❌ uygulanmamış |

İki yön de risk taşıyor: 10 yıl TR için erken silme, budaması olmayanlar ise
süresiz saklama. Doğru süreler **hedef pazara** bağlı ve doküman bunların
onayınızla kesinleşeceğini yazıyor.

### 3.3 HIPAA

`Mevzuat_Uyum_Iletilmesi_Gerekenler.pdf`: *"ABD pazarı seçildi. HIPAA için
ABD'de barındırma + sağlayıcıyla imzalı BAA şarttır."*

Yani **HIPAA kapsam içinde**. Yazılım tarafındaki karşılıkların bir kısmı
zaten var (erişim kaydı, şifreleme, yetki sınırları, denetim kaydı), ama:

- Barındırma bölgesi ve BAA **altyapı kararı** — kodla çözülmez
- HIPAA'ya özel bir kontrol listesi bu güne dek hiç uygulanmadı

### 3.4 Sağlık turizmi mevzuatı

Modül **kodda yok** — ne rota ne servis. Doğrulanacak bir yüzey bulunmuyor.

---

## Sizden gereken kararlar

1. **Bağımsız doktor randevusu:** brief mi geçerli, kod mu?
2. **Saklama süreleri:** hedef pazar TR mi, TR+AB+ABD mi? Süreler ona göre
   yapılandırılır (doküman onayınızı bekliyor).
3. **Silinen hastanın kaydı:** doküman "erişimi kısıtlı arşiv" istiyor;
   şu an klinik kaydı normal görüyor.
4. **HIPAA:** barındırma bölgesi ve BAA imzalanacak sağlayıcı.

Bunlar geldiğinde yazılım tarafı gecikmeden ilerleyebilir — dokümanın kendisi
de bunu söylüyor.
