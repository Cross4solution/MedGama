import { chromium, devices } from '@playwright/test';
const API = 'http://127.0.0.1:8001';
const jetonAl = async (rol) => {
  const y = await fetch(`${API}/api/demo-login/${rol}?key=yerel-demo-2026`, { redirect: 'manual' });
  const m = (y.headers.get('location') || (await y.text())).match(/demo_token=([^&"'\s]+)/);
  const jeton = decodeURIComponent(m[1]);
  const k = await (await fetch(`${API}/api/auth/me`, { headers: { Authorization: 'Bearer ' + jeton, Accept: 'application/json' } })).json();
  return { token: jeton, user: k.data || k.user || k };
};
const [yol, rol, metin] = process.argv.slice(2);
const b = await chromium.launch();
const c = await b.newContext({ ...devices['iPhone 13 Mini'], viewport: { width: 320, height: 900 } });
const o = await jetonAl(rol);
await c.addInitScript(([u, j]) => {
  localStorage.setItem('auth_state', JSON.stringify({ user: u, token: j, country: null }));
  localStorage.setItem('cookie_consent_v1', JSON.stringify({ necessary: true }));
}, [o.user, o.token]);
const p = await c.newPage();
await p.goto('http://127.0.0.1:3000/tr' + yol, { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.locator('button, a[href]').first().waitFor({ timeout: 60000 });
await p.waitForTimeout(2000);
console.log(await p.evaluate((ara) => {
  const g = document.documentElement.clientWidth;
  const t = [...document.querySelectorAll('button, a, span')].find(e => e.textContent.trim() === ara);
  if (!t) return 'öğe yok: ' + ara;
  const z = [];
  for (let e = t; e && e !== document.body; e = e.parentElement) {
    const r = e.getBoundingClientRect();
    z.push(`<${e.tagName.toLowerCase()}> sol=${Math.round(r.left)} gen=${Math.round(r.width)} sağ=${Math.round(r.right)} .${(e.className||'').toString().slice(0,78)}`);
  }
  return `ekran=${g}\n` + z.slice(0, 5).join('\n');
}, metin));
await b.close();
