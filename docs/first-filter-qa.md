# First-Filter QA Checklist (Internal)

Bu kontrol listesi, müşteriye gönderim öncesi ilk filtre olarak zorunludur.

## Navigasyon & Hero
- [ ] Header menüsü müşteri brief’i ile birebir: About MediTravel, For Patients, For Clinics, Vasco AI, Contact (opsiyonel)
- [ ] Marka adı ve logo: “MedGama” doğru yerde, tutarlı
- [ ] Hero başlığı: “Dünyanın 1 numaralı sağlık portalı”
- [ ] Hero alt metni: tek tıkla uçtan uca çözüm mesajı; eşleşme/matching ifadesi yok
- [ ] CTA sayısı ve metni doğru (tek CTA: Keşfet)

## Arama
- [ ] Global arama: tek input, klinik/doktor birleşik autocomplete (örnek veri ile çalışıyor)
- [ ] Özel arama: alan sırası Ülke → Şehir → Branş → Semptom/Prosedür
- [ ] Specialty ve Symptom/Procedure alanlarında autocomplete (datalist ile) var
- [ ] Gereksiz/duplicated arama alanları kaldırıldı

## İçerik Kutuları (6–8 Core Boxes)
- [ ] Kutuların adet ve başlıkları brief’e uygun
- [ ] Metinler müşteri onaylı kopya ile birebir (geçici metinler işaretlendi)
- [ ] Görsel/ikon tercihleri sade ve tutarlı

## Sayfalar & Rotalar
- [ ] Yeni menü rotaları tanımlı: /about, /for-patients, /for-clinics, /vasco-ai, /contact
- [ ] Tüm linkler çalışıyor, 404 yok
- [ ] CookieBanner ilgili sayfalarda görünüyor

## İçerik & Görseller
- [ ] Alakasız stok görsel yok (özellikle hero bölümü)
- [ ] Dönüşüm odaklı metinler; jargon ve karmaşadan kaçınılmış

## Erişilebilirlik & Performans
- [ ] Başlık hiyerarşisi ve buton etiketleri anlamlı
- [ ] Kontrastlar yeterli
- [ ] Konsol hatası yok, uyarılar gözden geçirildi

## Uyum & Güvenlik
- [ ] GDPR/HIPAA uyumluluğu mesajları doğru yerlerde
- [ ] Gizlilik bağlantıları (KVKK, Gizlilik) çalışıyor

## Çok Dilli & AI
- [ ] Çok dillilik için metinlerin dışarı alınması planlandı (i18n backlog)
- [ ] Vasco AI sayfası mevcut ve anlatımı doğru

---
Notlar:
- CoreBoxes metinleri müşteri onayı sonrası finalize edilecek.
- GlobalSearch/CustomSearch sonuç sayfası yönlendirmesi sonraki sprintte eklenecek.
