# MedaGama — Güvenlik Olayı Müdahale Prosedürü (Security Incident Runbook)

Bu doküman; MedaGama platformunda kişisel veri ihlali (data breach) tespit
edildiğinde uygulanacak adım adım prosedürü tanımlar. KVKK Md. 12, GDPR Art.
33-34 ve HIPAA § 164.408 yükümlülükleriyle uyumludur.

> **DPO İletişim:** dpo@medagama.com  
> **Güvenlik İletişim:** security@medagama.com  
> **KVK Kurumu Bildirim Portalı:** https://www.kvkk.gov.tr (Veri İhlali Bildirimi)

## 1. İlk 4 Saat — Tespit ve Triyaj

1. İhlali tespit eden kişi (çalışan / bug bounty / kullanıcı raporu) **derhal** DPO'yu
   ve `security@medagama.com` adresini bilgilendirir.
2. On-call mühendis `BreachNotificationService::notifyBreach([...])` çağırır
   ya da admin panelinden `POST /api/admin/security/breach-report` endpoint'ine
   olayı kayıt altına alır.
3. Yetki sızıntısı şüphesi varsa: tüm Sanctum tokenları geçersiz kıla
   (`personal_access_tokens` tablosu boşaltılır), ilgili kullanıcılara
   parola sıfırlama zorunlu kılınır.
4. Olay bilgisi audit log + Sentry + e-posta üzerinden saklanır.

## 2. 24 Saat — Etki Analizi

- Etkilenen kayıt sayısı, veri kategorileri (kimlik, sağlık, iletişim) tespit edilir.
- `audit_logs` ve uygulama logları korelasyonla kapsam belirlenir.
- Hassas veri (sağlık verisi — KVKK Md. 6 / GDPR Art. 9) içeriyorsa risk seviyesi
  **yüksek** olarak işaretlenir.
- Geçici azaltıcı önlemler alınır (firewall kuralı, IP banı, özelliği geçici devre dışı bırakma).

## 3. 72 Saat — Yetkili Otorite Bildirimi

KVKK Md. 12/5 ve GDPR Art. 33 uyarınca, ihlal öğrenildikten itibaren **en geç 72
saat** içinde KVK Kurumu'na (Türkiye) ve/veya yetkili AB denetim otoritesine
bildirim yapılır. Bildirim aşağıdakileri içerir:

- İhlalin niteliği, etkilenen veri sahibi sayısı, kategorileri
- Olası sonuçlar
- Alınmış / alınacak önlemler
- DPO iletişim bilgisi

> Sağlık verisi gibi özel nitelikli veriler söz konusuysa bildirim **muhakkak**
> yapılır — düşük risk istisnası uygulanmaz.

## 4. Etkilenen Kullanıcılara Bildirim

GDPR Art. 34 uyarınca, ihlal kullanıcı haklarına yüksek risk oluşturuyorsa
etkilenen kullanıcılara **gecikmeksizin** e-posta ile sade bir dilde bildirilir:

- Ne oldu, hangi verileri etkiledi
- Olası riskler
- Kullanıcının atması gereken adımlar (parola değiştir, kart bloke et vb.)
- DPO iletişim bilgisi

## 5. Post-Mortem ve Güvenlik Patch

- Olay sonrası 7 gün içinde post-mortem dokümanı hazırlanır (kök neden,
  zaman çizelgesi, alınan önlemler, geliştirme aksiyonları).
- Güvenlik açığı kod tabanında ise patch yayınlanır, regresyon testi yazılır.
- Çıkarılan dersler (`lessons learned`) `docs/SECURITY_LESSONS.md` dosyasına eklenir.
- 30 gün içinde aynı sınıfta yeni bir olay yaşanmaması için kontrol noktaları kurulur.

## 6. İletişim Şablonları

- `resources/views/emails/breach-user-notification.blade.php` (kullanıcı bildirimi)
- `resources/views/emails/breach-internal-alert.blade.php` (iç uyarı)

> Şablonlar hazır değilse DPO ile birlikte oluşturulur ve doküman güncellenir.
