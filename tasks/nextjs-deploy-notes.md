# Next.js Deploy Notları (Faz 5)

## Vercel Ayarı
- Framework preset: **Next.js** (Vercel otomatik algılar — `next.config.js` + `app/` var)
- Build command: `next build` (varsayılan)
- Output: `.next` (varsayılan)
- `vercel.json`: sadece güvenlik header'ları (CRA SPA rewrite KALDIRILDI — Next routing'i kırıyordu)
- `/api` + `/storage` proxy: `next.config.js` rewrites içinde (Render backend'e)

## Vercel Environment Variables (Production + Preview)
Mevcut CRA env'leriyle AYNI isimler (next.config `env` bloğu bunları client bundle'a inliyor):

```
REACT_APP_API_BASE=/api
REACT_APP_API_LOGIN_GOOGLE=/api/login/google
REACT_APP_API_ME=...
REACT_APP_API_SEND_OTP=...
REACT_APP_API_VERIFY_OTP=...
REACT_APP_GOOGLE_CLIENT_ID=<google oauth client id>
REACT_APP_MAPBOX_ACCESS_TOKEN=<mapbox token>
REACT_APP_PUSHER_APP_KEY=<pusher/reverb key>
REACT_APP_PUSHER_CLUSTER=<cluster>
REACT_APP_REVERB_APP_KEY=<reverb key>
REACT_APP_REVERB_HOST=<reverb host>
REACT_APP_REVERB_PORT=<reverb port>
REACT_APP_SITE_URL=https://medagama.com
```
Ek (Next-spesifik, server-side):
```
NEXT_PUBLIC_SITE_URL=https://medagama.com        # sitemap/robots/canonical
NEXT_PUBLIC_API_ORIGIN=https://medagama-backend.onrender.com   # SSR fetch + rewrites
```
NOT: Bu env'ler mevcut Vercel projesinde zaten REACT_APP_* olarak var olabilir — sadece NEXT_PUBLIC_SITE_URL + NEXT_PUBLIC_API_ORIGIN eklenmeli.

## Backend (Render)
- DEĞİŞMEDİ. Render backend olduğu gibi kalıyor.

## Geçiş Stratejisi (güvenli)
1. `feature/nextjs-migration` branch'i remote'a push → Vercel otomatik **PREVIEW** deployment üretir (production'a dokunmaz)
2. Preview URL'de tam test (tüm sayfalar, login, CRM, harita, chat)
3. Onay → branch main'e merge → production Vercel deploy
4. Sorun olursa: branch merge edilmez, main (CRA) çalışmaya devam eder

## Domain
- `medagama.com` netleşince: Vercel'de custom domain + NEXT_PUBLIC_SITE_URL güncelle

## Bilinen sınırlar / kontrol edilecekler (preview testinde)
- Authenticated CRM iç özellikleri (Recharts grafik, Mapbox harita, FullCalendar takvim) — login + sıcak backend ile test
- Google OAuth (REACT_APP_GOOGLE_CLIENT_ID set olmalı)
- Real-time chat/notifications (Pusher/Reverb env set olmalı)
- İçerik gövde SSR (Faz 3b) — şu an meta+JSON-LD server, gövde client
