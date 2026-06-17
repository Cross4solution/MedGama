// Root not-found boundary. Required for Next.js to emit a proper HTTP 404
// status when notFound() fires inside the dynamic [locale] segment — without
// this root boundary the nested [locale]/not-found.jsx renders but the
// response stays HTTP 200 (soft-404). Pure server component: no client deps,
// no i18n/router, so it never breaks static prerender.
export const metadata = {
  title: 'Sayfa Bulunamadı | MedaGama',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#ffffff',
          color: '#0f172a',
        }}
      >
        <main style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '4rem', fontWeight: 800, color: '#0d9488', margin: 0 }}>
            404
          </p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
            Sayfa Bulunamadı
          </h1>
          <p style={{ color: '#64748b', maxWidth: 420, margin: '0 auto 1.5rem' }}>
            Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
          </p>
          <a
            href="/tr"
            style={{
              display: 'inline-block',
              background: '#0d9488',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ana Sayfaya Dön
          </a>
        </main>
      </body>
    </html>
  );
}
