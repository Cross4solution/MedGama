// Nested locale not-found boundary — SERVER component (no 'use client', no
// i18n/router imports so it never breaks static prerender of sibling pages).
// Pairs with the root app/not-found.jsx so notFound() inside [locale] routes
// (doctor/clinic/tedaviler) resolves to a proper 404 response.
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        fontFamily:
          'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        color: '#0f172a',
      }}
    >
      <div>
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
      </div>
    </main>
  );
}
