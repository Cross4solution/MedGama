/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_ORIGIN || 'https://medagama-backend.onrender.com';

// CRA env uyumluluğu: kod hâlâ process.env.REACT_APP_* kullanıyor. Next bunları
// client'a vermez (sadece NEXT_PUBLIC_*). Aşağıdaki env bloğu bu değişkenleri
// build anında bundle'a inler → mevcut kod değişmeden çalışır. Vercel'de aynı
// REACT_APP_* isimleriyle set edilmeli.
const CRA_ENV = [
  'REACT_APP_API_BASE',
  'REACT_APP_API_LOGIN_GOOGLE',
  'REACT_APP_API_ME',
  'REACT_APP_API_SEND_OTP',
  'REACT_APP_API_VERIFY_OTP',
  'REACT_APP_GOOGLE_CLIENT_ID',
  'REACT_APP_MAPBOX_ACCESS_TOKEN',
  'REACT_APP_PUSHER_APP_KEY',
  'REACT_APP_PUSHER_CLUSTER',
  'REACT_APP_REVERB_APP_KEY',
  'REACT_APP_REVERB_HOST',
  'REACT_APP_REVERB_PORT',
  'REACT_APP_SITE_URL',
].reduce((acc, k) => { acc[k] = process.env[k] || ''; return acc; }, {});

// NOT: NEXT_PUBLIC_GA_ID ve NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
// NEXT_PUBLIC_ prefix'i sayesinde Next tarafından otomatik client'a inlenir.
// CRA_ENV listesine eklemeye GEREK YOK (yalnızca REACT_APP_* için gerekiyor).
const nextConfig = {
  reactStrictMode: true,
  env: CRA_ENV,
  // Hangi teknolojiyi kullandığımızı yanıt başlığında ilan etmeye gerek yok.
  // Sürüme özgü açıkları arayan otomatik taramaların işini kolaylaştırıyor.
  poweredByHeader: false,
  // CRA ile aynı backend'e proxy: /api ve /storage Render backend'e gider
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/storage/:path*', destination: `${BACKEND}/storage/:path*` },
      // Kanal yetkilendirmesi. API_BASE "/api" olduğu için Echo authEndpoint'i
      // "/broadcasting/auth" olarak çözüyor; burada kural yoktu, istek Next'e düşüp
      // 404 dönüyordu. Kanala girilemediği için görüntülü görüşme sinyali hiç akmıyordu.
      { source: '/broadcasting/:path*', destination: `${BACKEND}/broadcasting/:path*` },
      // CRA'daki /500 rotası App Router'da rezerve isim (pages/500.html ile çakışıyor).
      // Aynı sayfayı /server-error altından servis et, /500 URL'i korunur.
      { source: '/500', destination: '/tr/server-error' },
    ];
  },
  images: {
    // BEYAZ LİSTE — burada "**" YAZMAYIN.
    //
    // Eskiden `hostname: '**'` idi ve üstündeki yorum optimizasyonun kapalı
    // olduğunu söylüyordu; ayar hiç konmamıştı, yani optimizasyon açıktı.
    // Sonuç: /_next/image İNTERNETTEKİ HERHANGİ bir görseli işleyip
    // sunuyordu. Canlıda doğrulandı — Wikipedia, GitHub ve rastgele siteler
    // bizim alan adımız üzerinden geçti.
    //
    // İki somut zarar: Vercel görsel işlemeyi faturalandırıyor (kota
    // tüketilebilir) ve daha ağırı, bizim alan adımız üzerinden herhangi bir
    // içerik dağıtılabiliyordu. Sağlık platformu için kabul edilebilir değil.
    //
    // Liste kodun taranmasıyla değil, CANLI VERİNİN taranmasıyla çıkarıldı;
    // yeni bir kaynak eklenirse görsel sessizce kırılır, buraya eklenmeli.
    remotePatterns: [
      // Tohum verisindeki tüm görseller (canlıda 113 kayıt).
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Görsel bulunmayan kartlarda yer tutucu.
      { protocol: 'https', hostname: 'placehold.co' },
      // Ülke bayrakları (telefon kodu ve dil seçici).
      { protocol: 'https', hostname: 'flagcdn.com' },
      // MedStream video gönderilerinin kapak görselleri.
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      // Arka uç depolama. Normalde Vercel yönlendirmesiyle aynı kaynaktan
      // geliyor; doğrudan adresle gelen durumlar için de açık.
      { protocol: 'https', hostname: 'medagama-backend.onrender.com' },
      { protocol: 'https', hostname: 'medagama.com' },
      { protocol: 'https', hostname: 'www.medagama.com' },
      // Yerel geliştirme — arka uç http üzerinden çalışıyor.
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
    // SVG betik taşıyabilir; optimizasyondan geçirilmesi XSS yüzeyi açar.
    dangerouslyAllowSVG: false,
  },
  eslint: {
    // Derleme lint'e takılmasın: stil uyarısı yüzünden dağıtım durmamalı.
    //
    // Bu, çökme denetiminin atlandığı anlamına GELMEZ — o ayrı çalışıyor:
    //   npm run lint:crash
    // .eslintrc.json yalnızca çalışma-anı çökmelerini hedefliyor (eksik
    // import, kapsam dışı değişken, kural dışı hook). Derlemede kapalı
    // kalması bilinçli; asıl kapı o betik.
    ignoreDuringBuilds: true,
  },

  // İçerik Güvenlik Politikası — ÖNCE YALNIZCA İZLEME.
  //
  // CSP, tarayıcıya "kod ve içerik yalnızca şu kaynaklardan gelebilir" der ve
  // XSS'e karşı en güçlü katmandır: saldırgan sayfaya betik enjekte etse bile
  // tarayıcı çalıştırmaz.
  //
  // Ama yanlış yazılmış bir politika meşru şeyleri de keser — harita, video,
  // analitik, canlı bildirim. Bu yüzden `Report-Only` başlığıyla açılıyor:
  // tarayıcı HİÇBİR ŞEYİ engellemez, yalnızca "bu politika olsaydı şunu
  // keserdim" diye rapor gönderir. Raporlar birkaç gün izlenip politika
  // gerçek trafiğe göre düzeltildikten sonra engelleyici moda alınacak.
  async headers() {
    const politika = [
      "default-src 'self'",
      // Next.js kendi betiklerini satır içi yerleştiriyor; nonce'a geçilene
      // kadar unsafe-inline gerekli. Raporlar bunun ne kadar daraltılabileceğini
      // gösterecek.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://api.mapbox.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      // Görseller çok kaynaklı (klinik/doktor avatarları, bayraklar, yer
      // tutucular, arka uç depolama) — https geneli bilinçli.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Canlı bildirim ve görüntülü görüşme sinyali için soket bağlantısı.
      "connect-src 'self' https://www.google-analytics.com https://api.mapbox.com https://events.mapbox.com https://medagama-backend.onrender.com wss://57-128-27-244.sslip.io",
      // MedStream'de YouTube gömülü videolar var.
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      // Eklenti/nesne gömme tamamen kapalı — kullanılmıyor, saldırı yüzeyi.
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // upgrade-insecure-requests BİLEREK yok: izleme modunda tarayıcı onu
      // zaten yok sayıyor ve her sayfada konsola uyarı basıyor. Engelleyici
      // moda geçerken eklenecek.
      // İhlaller arka uçta toplanıyor (hız sınırlı, kırpılmış).
      'report-uri /api/csp-report',
    ].join('; ');

    // ── Diğer güvenlik başlıkları ────────────────────────────────────────
    //
    // Ölçüldüğünde yanıtlarda BUNLARIN HİÇBİRİ yoktu. CSP içinde
    // `frame-ancestors 'none'` yazıyor ama izleme modunda engellemiyor,
    // yalnız rapor ediyor — yani site bir iframe'e gömülebiliyordu.
    const guvenlikBasliklari = [
      // Tıklama hırsızlığı. CSP engelleyici moda geçtiğinde `frame-ancestors`
      // bunu devralacak; o güne kadar tek koruma bu.
      { key: 'X-Frame-Options', value: 'DENY' },

      // Tarayıcının içeriğin türünü "tahmin etmesini" kapatır. Tahmin,
      // yüklenen bir dosyanın betik olarak çalıştırılmasına yol açabiliyor.
      { key: 'X-Content-Type-Options', value: 'nosniff' },

      // Adresler hasta ve hekim kimliği taşıyor (`/doctor/{id}`,
      // `/patient/appointments`). Tam adresin üçüncü taraflara gitmesi
      // sızıntıdır; dış sitelere yalnız alan adı gidiyor.
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

      // Kamera, mikrofon ve konum AÇIK BIRAKILIYOR — telesağlık görüşmesi ve
      // "yakınımdakiler" bunlara ihtiyaç duyuyor. Kapatmak çalışan özellikleri
      // kırardı. Kullanılmayanlar kapatılıyor.
      {
        key: 'Permissions-Policy',
        value: [
          'camera=(self)',
          'microphone=(self)',
          'geolocation=(self)',
          'payment=()',
          'usb=()',
          'magnetometer=()',
          'accelerometer=()',
          'gyroscope=()',
        ].join(', '),
      },
    ];

    // HSTS BURADA YOK — `vercel.json` gönderiyor.
    //
    // İlk sürüm buraya da ekliyordu ve bu yanlıştı: iki `Strict-Transport-
    // Security` başlığı gidince hangisinin geçerli olduğu belirsizleşiyor
    // (süreleri ve `preload` durumları farklı). Tek kaynak `vercel.json`.
    //
    // Buradaki başlıklar Vercel DIŞINDA barındırılırsa devreye giren yedek:
    // `vercel.json` o zaman hiç uygulanmaz ve site sessizce korumasız kalırdı.
    // Aynı değerler iki kez gitse de zararsız; çelişen bir değer yok.

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy-Report-Only', value: politika },
          ...guvenlikBasliklari,
        ],
      },
    ];
  },
};

module.exports = nextConfig;
