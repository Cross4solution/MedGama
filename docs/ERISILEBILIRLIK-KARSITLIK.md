# Renk karşıtlığı ölçümü — karar bekleyen bulgu

Erişilebilirlik testleri (`tests/e2e/erisilebilirlik.spec.js`) ekran okuyucuyla
ilgili olanı kapsıyor: adsız düğme, eksik `alt`, yanlış sayfa dili. Renk
karşıtlığı orada **kapsanmıyor**, çünkü bulunan sorun bir kod hatası değil bir
**tasarım kararı** ve tek taraflı değiştirilecek bir şey değil.

Ölçüm tarayıcıda, gerçek hesaplanmış renkler üzerinden yapıldı (WCAG 2.1
göreli parlaklık formülü). Görsel üzerine gelen metinler **dışlandı**: arka
planı bir görselse oran güvenilir ölçülemiyor.

## Bulgu

Ana sayfada başarısız olan birleşimler dağınık hatalar değil, **iki markadan**
geliyor:

| Ön plan | Zemin | Oran | Gereken | Yaklaşık adet |
|---|---|---|---|---|
| `#0D9488` (teal-600) | beyaz | **3.74** | 4.5 | ~30 |
| beyaz | `#0D9488` (teal-600) | **3.74** | 4.5 | ~26 |
| `#9CA3AF` (gray-400) | beyaz | **2.54** | 4.5 | 4 |
| beyaz | `#F43F5E` (rose-500) | 3.67 | 4.5 | 1 |

Yani sorun tek tek sınıflarda değil: **marka aksan rengi `#0D9488`, beyazla her
iki yönde de küçük metin eşiğini geçmiyor.**

Eşik hatırlatması (WCAG 2.1 AA): normal metin 4.5:1, büyük metin (≥24px veya
kalın ≥18.66px) 3:1.

## Neden önemli

- Düşük karşıtlık en çok yaşlı kullanıcıyı ve düşük görme keskinliği olanı
  etkiliyor — bir sağlık platformunun kullanıcı kitlesinde ikisi de yoğun.
- AB erişilebilirlik mevzuatı AA seviyesini bekliyor.
- Etkilenen metinler süs değil: "Konumumu kullan", "Keşfet", "Görüntüle",
  arama alanının yardım metinleri — yani ana akışın kendisi.

## Seçenekler

1. **Bir ton koyulaştırmak (en küçük değişiklik).** Aynı Tailwind paletinde
   kalır, marka kimliği korunur:
   - `teal-600 #0D9488` → `teal-700 #0F766E` = beyazla **5.2:1**
   - `gray-400 #9CA3AF` → `gray-500 #6B7280` = beyazla **4.83:1**
   Düğme zeminlerinde de aynı ton kullanılırsa beyaz yazı eşiği geçer.

2. **Yalnızca küçük metinde koyulaştırmak.** Büyük başlıklarda ve geniş
   yüzeylerde mevcut teal kalır (eşik orada 3:1 ve zaten geçiyor), yalnız
   ≤14px metinlerde koyu ton kullanılır. Görsel değişim daha az, uygulaması
   daha dağınık.

3. **Bırakmak.** Ölçüm kayda geçti; bilerek verilmiş bir karar olur.

## Bu dosya neden test değil

Karşıtlık denetimini pakete koymak, karar verilene kadar sürekli kırmızı yanan
bir test bırakırdı. Sürekli kırmızı test okunmaz hâle gelir ve yanındaki gerçek
hatayı da görünmez yapar. Karar verildikten sonra eşik testi eklenebilir;
ölçüm betiği bu dosyadaki yöntemle birebir aynı.

## Ölçülmeyen kalanlar

Karşıtlık dışında elle bakılması gerekenler:

- Odak sırası ve klavyeyle gezinme
- Ekran okuyucuyla gerçek akış (özellikle randevu alma ve ödeme)
- Hareket/animasyon tercihi (`prefers-reduced-motion`)
- Görsel üzerindeki metinlerin karşıtlığı (otomatik ölçülemiyor)
