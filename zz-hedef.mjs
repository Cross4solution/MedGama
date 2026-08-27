import { chromium, devices } from '@playwright/test';
const b = await chromium.launch();
const p = await (await b.newContext(devices['iPhone 13 Mini'])).newPage();
for (const r of ['/register', '/forgot-password', '/login']) {
  await p.goto('http://127.0.0.1:3000/tr' + r, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.locator('button, a[href]').first().waitFor({ timeout: 90000 });
  await p.waitForTimeout(1200);
  console.log(r.padEnd(18), await p.evaluate(() => {
    const kucuk = [];
    for (const e of document.querySelectorAll('button, input[type=checkbox], a[href]')) {
      const c = getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden') continue;
      if (e.tagName === 'A' && c.display.startsWith('inline') && e.closest('p, li, span')) continue;
      const r = e.getBoundingClientRect();
      const sar = e.closest('label');
      const etkin = sar ? sar.getBoundingClientRect() : r;
      if (!r.width) continue;
      if (Math.max(r.width, etkin.width) >= 24 && Math.max(r.height, etkin.height) >= 24) continue;
      kucuk.push(`"${(e.textContent || e.getAttribute('aria-label') || e.type || '').trim().slice(0,22)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return kucuk.length ? '24px altı: ' + kucuk.join(' | ') : 'hepsi ≥24px';
  }));
}
await b.close();
