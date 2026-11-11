// All 19 pages with third parties allowed (only the payment server is held back so no session is created here):
// console errors, page errors, failed or non-200 requests, and every third-party host each page talks to.
const { launch } = require('./lib');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
(async () => {
  const b = await launch(); let problems = 0;
  for (const [mode, w, h] of [['phone', 390, 844], ['desktop', 1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mode === 'phone', hasTouch: mode === 'phone' });
    await ctx.route(/onrender\.com\/api/, r => r.abort());
    for (const p of PAGES) {
      const page = await ctx.newPage(); const errs = [], bad = [], hosts = new Set();
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
      page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 160)));
      page.on('requestfailed', r => bad.push('FAILED ' + r.url().slice(0, 90) + ' ' + (r.failure() || {}).errorText));
      page.on('response', r => { try { const u = new URL(r.url()); if (u.hostname !== 'localhost') hosts.add(u.hostname.replace(/^[0-9a-f]{10,}\.w\./, '*.w.')); } catch (e) {} if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().slice(0, 90)); });
      await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
      await page.waitForTimeout(p === '/contact/' ? 5000 : 1500);
      const expected = l => /onrender\.com\/api|logo\.png|localhost detected|net::ERR_FAILED|Unknown plan|Failed to fetch|Checkout failed to load|errors\.stripe\.com|status of 429/.test(l);
      const e2 = errs.filter(l => !expected(l)), b2 = bad.filter(l => !expected(l));
      if (e2.length || b2.length) problems++;
      console.log(mode.padEnd(8), p.padEnd(30), 'hosts:', [...hosts].sort().join(',') || '-', e2.length || b2.length ? '| UNEXPECTED: ' + JSON.stringify(e2.concat(b2)) : '| clean');
      await page.close();
    }
    await ctx.close();
  }
  console.log('pages with unexpected errors:', problems);
  await b.close();
})();
