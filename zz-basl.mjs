import { chromium, devices } from '@playwright/test';
const b = await chromium.launch();
const p = await (await b.newContext({ ...devices['iPhone 13 Mini'], viewport: { width: 768, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:3000/tr/medstream', { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.locator('button, a[href]').first().waitFor({ timeout: 60000 });
await p.waitForTimeout(1500);
console.log(await p.evaluate(() => {
  const g = document.documentElement.clientWidth;
  const t = [...document.querySelectorAll('a, button')].find(e => /Kayıt Ol/.test(e.textContent));
  const z = [];
  for (let e = t; e && e !== document.body; e = e.parentElement) {
    const r = e.getBoundingClientRect();
    z.push(`<${e.tagName.toLowerCase()}> sol=${Math.round(r.left)} gen=${Math.round(r.width)} sağ=${Math.round(r.right)} .${(e.className||'').toString().slice(0,85)}`);
  }
  return `ekran=${g}\n` + z.slice(0,5).join('\n');
}));
await b.close();
