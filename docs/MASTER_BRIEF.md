# 🧬 Medagama: Sistem Mimarisi ve Teknik DNA (Master Brief)

> Bu doküman, Medagama platformunun kullanıcı hiyerarşisini, ticari modelini ve teknik standartlarını tanımlayan **tek gerçek kaynaktır** (Single Source of Truth). Kod yazarken veya öneride bulunurken bu kuralların dışına çıkılmamalıdır.

---

## 🏗️ 1. Kullanıcı Hiyerarşisi (Tiers)

Sistem, roller yerine **"Seviyeler" (Levels)** üzerine kurulu keskin bir yetki matrisi ile yönetilir:

### Seviye 1: Hastalar (General Users)
- Hizmet alan taraftır
- Arama yapar, randevu oluşturur (S3 için) ve iletişim kurar

### Seviye 2: Bağımsız Doktorlar (Independent Professionals)
- **Odak:** Kişisel markalama, MedStream (sosyal etkileşim) ve hasta kabulü
- **Yetki:** Hastalardan randevu kabul eder ve telesağlık görüşmesi yapar —
  kliniğe bağlı olma zorunluluğu yoktur.

> Bu madde 29 Ağustos 2026'da düzeltildi. Önceki hâli "randevu alma veya
> Telehealth yetkisi yoktur" diyordu; sistem başından beri tersini yapıyor ve
> veritabanında bağımsız hekimlere ait randevular var. Ürün kararı: bağımsız
> hekim de platformdan hizmet verebilir. Kod değişmedi, belge kodun yaptığına
> uyduruldu.

### Seviye 3: Klinikler (The Transactional Hub)
- **Odak:** Ticari operasyon. Randevu yönetimi ve Telehealth sunar
- **Hiyerarşi:** Kendi bünyesinde doktorları barındırabilir ve yönetebilir

### Seviye 4: Hastane Grupları (Corporate Showcase)
- **Odak:** Kurumsal prestij ve Şube Yönetimi (Multi-branch)
- **Sınır:** Doğrudan randevu alımı yoktur; kurumsal vitrin ve yönlendirme merkezidir

---

## 🗺️ 2. Lokasyon ve Harita Entegrasyonu (Mapbox)

- **Teknoloji:** Harita altyapısı olarak **Mapbox** kullanılır
- **Mantık:** Hizmet sağlayıcılar (S2, S3, S4), Mapbox üzerinden aldıkları link/koordinat bilgisini sisteme ekler
- **Görsel:** Platform, bu veriyi Mapbox API/Iframe üzerinden modern ve özelleştirilmiş bir şekilde profil sayfasında render eder

---

## 💼 3. Ticari Model ve CRM (SaaS)

- **Medagama CRM:** Platforma tam entegre bir hasta yönetim panelidir
- **Erişim:** Yalnızca ücretli abonelik sahibi olan Seviye 2, 3 veya 4 kullanıcıları tarafından satın alınabilir
- Pazaryeri trafiğini profesyonelce yönetmelerini sağlar

---

## 🔍 4. Bilgi Mimarisi (Arama & Eşleştirme)

- **Semptom Odaklı:** ICD-10 (Hastalık Kodları) **KESİNLİKLE KULLANILMAZ**
- **Arama Mantığı:** Eşleştirme "Halk Dili" (Tedaviler ve Semptomlar) üzerinden yapılır
- Hasta "İmplant" veya "Leke Tedavisi" yazdığında ilgili sağlayıcıyı bulur

---

## 💻 5. Teknik Standartlar

- **Stack:** Laravel 11 (Backend) + React (SPA Frontend)
- **Real-Time:** Laravel Reverb (WebSocket). Tüm bildirimler ve mesajlar sayfa yenilenmeden akar
- **UI:** Kurumsal renk **Medagama Purple (#7C3AED)**. Modern, hızlı ve akışkan bir deneyim esastır
