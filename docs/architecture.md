# Frontend Mimarisi ve Klasör Yapısı

Bu doküman projede kullanılacak frontend mimari prensiplerini ve klasör yapısını özetler. Tasarım ve davranış değiştirilmeden yalnızca yapı ve organizasyon standartlaştırılmıştır.

## Klasör Yapısı (src/)

- `assets/`: Global stiller, görseller.
- `components/`: Paylaşılan, tekrar kullanılabilir UI bileşenleri.
- `pages/`: Route seviyesindeki sayfalar (container/route components).
- `context/`: React Context dosyaları (ör. AuthContext).
- `utils/`: Küçük yardımcı fonksiyonlar ve tekil util dosyaları.
- `hooks/`: Tekil veya paylaşılan React hook'ları (UI/iş mantığı ayrımı gözetilerek).
- `services/`: API istemcileri, HTTP çağrıları, dış kaynak entegrasyonları.
- `constants/`: Uygulama genelinde kullanılan sabitler ve enum benzeri yapılar.
- `config/`: Ortam değişkenleri ve çalışma zamanı konfigürasyonu.
- `lib/`: Üçüncü partiye sarmalayıcı kütüphaneler veya core yardımcı modüller.
- `types/`: JSDoc typedef'leri veya TS'ye geçiş için tip tanımları.
- `store/`: (Geleceğe dönük) Global state için adapter katmanı (Redux/Zustand/Recoil vs.).

## Import Stratejisi

`jsconfig.json` ile `baseUrl` = `src` yapılmıştır. Bu sayede importlar sadeleşir:

```js
// Önceki
import Header from '../../components/Header';
// Artık
import Header from 'components/Header';
```

> Not: CRA (react-scripts) `paths` aliaslarını build aşamasında çözmez, bu nedenle yalnızca `baseUrl` kullanılmaktadır.

## Kod Stili ve Kalite

- `.editorconfig` ve `.prettierrc` eklendi. Editor ve CI seviyesinde tutarlı biçimlendirme sağlar.
- Test başlangıcı için `src/setupTests.js` eklendi (Testing Library Jest DOM).

## Bileşen Kategorizasyonu (Öneri)

- `components/` altında alt klasörler: `common/`, `layout/`, `forms/`, `modals/`, `timeline/` gibi.
- Büyük bileşenler için dosya ikilisi: `Component.jsx` + `Component.test.jsx` (ileride).

## UI/İş Mantığı Ayrımı

- UI-only bileşenlerde yan etkiler/minimum state.
- Data erişimi `services/` içinde, component içine hook ile (`useXYZ`) taşınır.

## Ortam Değişkenleri

- `config/index.js` üzerinden okunur. `.env` değerleri `REACT_APP_` prefix'i ile gelir.

## Testler (Öneri)

- Unit: Jest + React Testing Library
- Component: Kritik UI için snapshot + erişilebilirlik kontrolleri

Bu yapı mevcut tasarıma dokunmadan, okunabilirliği ve ölçeklenebilirliği arttırmak için temel atar.
