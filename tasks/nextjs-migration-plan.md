# MedaGama — CRA → Next.js Taşıma Planı

**Hedef:** CRA (React 19 SPA) → Next.js App Router. SEO için public sayfalar sunucuda render (SSR/SSG); CRM/dashboard client-side kalır. Tamamen ücretsiz, dış servis yok, Vercel native.

**Strateji:** Yeni branch'te Next.js iskelesi kurulur, component'ler taşınır, routing dosya-tabanlına çevrilir. CRA ve Next aynı klasörde yaşayamaz → temiz geçiş. main bozulmaz; bitince ayrı PR.

---

## Kararlar
- **App Router** (Pages Router değil) — modern, server components, en iyi SSR/SSG
- **TypeScript opsiyonel** — şimdilik JS kalır (mevcut kod JS), taşıma riskini azaltır
- **i18n:** react-i18next korunur (client) + locale-aware routing sonra eklenir. Faz sonrası `next-intl`'e geçiş değerlendirilir
- **Stil:** TailwindCSS aynen taşınır (Next destekler)
- **API:** axios `lib/api.js` korunur. SEO sayfaları ek olarak server-side fetch alır
- **Backend:** Render'da kalır, dokunulmaz

---

## Fazlar (her faz sonunda build + test geçmeli)

### FAZ 0 — İskelet (yeni branch)
1. `feature/nextjs-migration` branch
2. Next.js App Router iskelesi (`app/`, `next.config.js`, tailwind entegre)
3. Provider'ları `app/providers.jsx` (use client) içinde topla: Auth, Toast, Cookie, Favorites, Notifications, i18n
4. `app/layout.jsx` — root, `<html lang>`, global css, providers
5. Env: `REACT_APP_*` → `NEXT_PUBLIC_*` (13 değişken), `.env.example` güncelle
- **Verify:** boş Next app boot eder, provider'lar yüklenir

### FAZ 1 — Paylaşılan altyapı
6. `src/components`, `src/lib`, `src/utils`, `src/context`, `src/hooks`, `src/data`, `src/i18n` → Next yapısına taşı (çoğu olduğu gibi çalışır)
7. `lib/api.js` axios — aynen çalışır
8. Client-only riskleri işaretle: `window`/`document`/`localStorage` modül-seviyesi kullanımları → guard ekle veya `dynamic(..., {ssr:false})`
- **Verify:** import path'ler çözülür, build temiz

### FAZ 2 — Routing (react-router → App Router dosya yapısı)
9. Her route → dosya: `app/page.jsx` (/), `app/doctor/[id]/page.jsx`, `app/clinic/[id]/page.jsx`, `app/search/page.jsx`, `app/about/page.jsx`, `app/crm/...` vb.
10. `useNavigate` → `useRouter` (next/navigation), `useParams` → next `useParams`, `useLocation` → `usePathname`/`useSearchParams`, `<Link>` → `next/link`, `<Navigate>` → `redirect()` (25+ dosya)
11. PrivateRoute guard → layout-level kontrol veya middleware
- **Verify:** tüm route'lar açılır, navigasyon çalışır

### FAZ 3 — SEO (asıl kazanç)
12. Public/SEO sayfaları **Server Component** yap: doktor/klinik/landing verisini sunucuda Laravel API'den çek → hazır HTML
13. SEOHead/Helmet → Next **Metadata API** (`generateMetadata`) — title/desc/canonical/OG/JSON-LD/hreflang
14. Private sayfalar `"use client"` — client-side kalır (CRM/dashboard)
15. sitemap → Next `app/sitemap.js` (dinamik) + `app/robots.js`
- **Verify:** sayfa kaynağında (view-source) içerik HAM HTML olarak var, meta dolu

### FAZ 4 — Client-only entegrasyonlar
16. Mapbox, Recharts, Pusher/Reverb → `dynamic(() => import(...), { ssr: false })`
17. Google OAuth, localStorage auth → hydration-safe (useEffect içinde)
- **Verify:** harita/grafik/chat/login çalışır, hydration hatası yok

### FAZ 5 — Deploy
18. Vercel: Next.js preset (vercel.json rewrites kaldırılır, Next config'e taşınır veya backend'e CORS ile direkt)
19. `/api` proxy → `next.config.js` rewrites veya direkt backend çağrısı
20. Staging deploy + tam test → onay → main'e merge
- **Verify:** canlı staging'de tüm akışlar çalışır

---

## Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Hydration mismatch (localStorage auth) | Orta | Auth check useEffect'te, ilk render server-safe |
| window/document modül-seviyesi | Yüksek | guard + dynamic ssr:false |
| 25+ dosyada router API değişimi | Yüksek (mekanik) | Faz 2'de sistematik, dosya dosya test |
| i18n SSR (dil tespiti) | Orta | İlk aşama client i18n, sonra locale routing |
| Real-time (Pusher/Reverb) | Orta | Client component, ssr:false |
| Google OAuth script | Düşük | useEffect mount |
| Deploy proxy (/api) | Orta | next rewrites veya CORS |

---

## Süre Tahmini
- Faz 0-1: ~1 gün (iskelet + altyapı)
- Faz 2: ~2 gün (routing — en yoğun)
- Faz 3: ~1-2 gün (SEO — asıl değer)
- Faz 4: ~1 gün (client entegrasyonlar)
- Faz 5: ~0.5 gün (deploy + test)
- **Toplam: ~5-7 gün dikkatli iş**

## Güvenlik
- main bozulmaz — ayrı branch
- Mevcut canlı site çalışmaya devam eder
- Bitince staging'de doğrulanır, sonra geçiş
- Geri dönüş: branch merge edilmezse hiçbir şey değişmez
