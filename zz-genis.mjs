import { chromium, devices } from '@playwright/test';
const API = 'http://127.0.0.1:8001';
const jetonAl = async (rol) => {
  const y = await fetch(`${API}/api/demo-login/${rol}?key=yerel-demo-2026`, { redirect: 'manual' });
  const h = y.headers.get('location') || (await y.text());
  const m = h.match(/demo_token=([^&"'\s]+)/);
  if (!m) return null;
  const jeton = decodeURIComponent(m[1]);
  const k = await (await fetch(`${API}/api/auth/me`, { headers: { Authorization: 'Bearer ' + jeton, Accept: 'application/json' } })).json();
  return { token: jeton, user: k.data || k.user || k };
};

const SAYFALAR = [
  ['/medstream', null], ['/search', null], ['/browse/clinics', null], ['/browse/treatments', null],
  ['/login', null], ['/register', null], ['/contact', null], ['/about', null], ['/doctors-departments', null],
  ['/crm', 'klinik'], ['/crm/billing', 'klinik'], ['/crm/patients', 'klinik'], ['/crm/calendar', 'klinik'],
  ['/crm/messages', 'klinik'], ['/crm/revenue', 'klinik'], ['/crm/prescriptions', 'klinik'], ['/crm/staff', 'klinik'],
  ['/doctor/appointments', 'doktor'], ['/doctor/dashboard', 'doktor'], ['/doctor/billing', 'doktor'],
  ['/patient/appointments', 'hasta'], ['/patient/invoices', 'hasta'], ['/patient-dashboard', 'hasta'],
  ['/profile', 'hasta'], ['/settings', 'hasta'], ['/notifications', 'hasta'], ['/medical-archive', 'hasta'],
];

const b = await chromium.launch();
for (const [ad, en] of [['telefon', 375], ['küçük telefon', 320]]) {
  console.log(`\n══ ${ad} (${en}px)`);
  for (const [yol, rol] of SAYFALAR) {
    const c = await b.newContext({ ...devices['iPhone 13 Mini'], viewport: { width: en, height: 900 } });
    if (rol) {
      const o = await jetonAl(rol);
      if (o) await c.addInitScript(([u, j]) => {
        localStorage.setItem('auth_state', JSON.stringify({ user: u, token: j, country: null }));
        localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary: true, analytics: false }));
      }, [o.user, o.token]);
    }
    const p = await c.newPage();
    try {
      await p.goto('http://127.0.0.1:3000/tr' + yol, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await p.locator('button, a[href]').first().waitFor({ timeout: 60000 });
      await p.waitForTimeout(1500);
      const o = await p.evaluate(() => {
        const g = document.documentElement.clientWidth;
        const disarda = [];
        for (const e of document.querySelectorAll('button, a[href], [role="button"]')) {
          const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
          if (!r.width || s.display === 'none' || s.visibility === 'hidden') continue;
          if (r.left >= g || r.right <= g + 2) continue;
          let kaydirilabilir = false;
          for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
            const o = getComputedStyle(a).overflowX;
            if (o === 'auto' || o === 'scroll') { kaydirilabilir = true; break; }
          }
          if (kaydirilabilir) continue;
          disarda.push(`"${(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,20)}" sağ=${Math.round(r.right)}`);
        }
        return { kayma: document.documentElement.scrollWidth - g, disarda: disarda.slice(0,3), yol: location.pathname };
      });
      const bayrak = [o.kayma > 2 ? `KAYMA +${o.kayma}px` : '', o.disarda.length ? `EKRAN DIŞI: ${o.disarda.join(' | ')}` : ''].filter(Boolean);
      console.log(`  ${bayrak.length ? '✗' : '✓'} ${yol.padEnd(24)} ${bayrak.join(' · ') || 'temiz'}`);
    } catch (e) { console.log(`  ? ${yol.padEnd(24)} ${e.message.split('\n')[0].slice(0,60)}`); }
    await c.close();
  }
}
await b.close();
