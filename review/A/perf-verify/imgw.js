const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
  for (const p of ['/', '/start/', '/work/', '/web-design-baton-rouge/']) {
    await page.goto(BASE + p, { waitUntil: 'load' });
    const rows = {};
    for (const w of [360, 390, 430, 599, 600, 759, 760, 979, 980, 1099, 1100, 1280, 1440, 1920]) {
      await page.setViewportSize({ width: w, height: 844 });
      const ws = await page.evaluate(() => [...document.images].map(i => Math.round(i.getBoundingClientRect().width)));
      ws.forEach((x, i) => { (rows[i] = rows[i] || []).push(w + ':' + x); });
    }
    console.log('==', p); Object.values(rows).forEach((r, i) => console.log('  img' + (i + 1), r.join('  ')));
  }
  await b.close();
})();
