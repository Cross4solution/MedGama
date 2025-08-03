# Resim Dosyaları - Optimizasyon Rehberi

Bu klasöre optimize edilmiş resim dosyalarınızı koyun.

## Gerekli Resim Dosyaları:

### 1. Hero Bölümü (Ana Sayfa) ✅ TAMAMLANDI
- **Dosya Adı**: `caroline-lm-uqved8dypum-unsplash_720.jpg`
- **Boyut**: 720px genişlik
- **Dosya Boyutu**: 67KB
- **Açıklama**: Doktor konsültasyonu fotoğrafı (modern klinik ortamında)
- **Durum**: Aktif olarak kullanılıyor

### 2. Klinik Kartları
- **Dosya Adı**: `clinic-anadolu.webp`
- **Boyut**: 300x200px
- **Maksimum Dosya Boyutu**: 25KB
- **Açıklama**: Anadolu Sağlık Merkezi binası

- **Dosya Adı**: `clinic-memorial.webp`
- **Boyut**: 300x200px
- **Maksimum Dosya Boyutu**: 25KB
- **Açıklama**: Memorial Hastanesi binası

- **Dosya Adı**: `clinic-ege.webp`
- **Boyut**: 300x200px
- **Maksimum Dosya Boyutu**: 25KB
- **Açıklama**: Ege Üniversitesi Tıp Fakültesi

## Optimizasyon Önerileri:

1. **Format**: WebP kullanın (en iyi sıkıştırma)
2. **Kalite**: %80-85 arası (boyut/kalite dengesi için)
3. **Fallback**: Eski tarayıcılar için JPEG versiyonları da ekleyin
4. **Boyut**: Belirtilen maksimum dosya boyutlarını aşmayın

## Dosya Yapısı:
```
public/images/
├── caroline-lm-uqved8dypum-unsplash_720.jpg ✅ (Hero bölümü)
├── clinic-anadolu.webp (Bekleniyor)
├── clinic-memorial.webp (Bekleniyor)
├── clinic-ege.webp (Bekleniyor)
└── README.md
```

## Not:
- Resimleri bu klasöre koyduktan sonra site otomatik olarak optimize edilmiş versiyonları kullanacak
- Lazy loading ve responsive tasarım otomatik olarak aktif olacak 