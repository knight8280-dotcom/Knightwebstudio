// Screenshot the END of a page (closing band + footer) at given sizes/themes.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage();
    await p.goto(process.argv[2] || 'http://localhost:8720/pricing/', { waitUntil: 'networkidle' });
    await p.evaluate(() => { document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')); });
    const band = await p.$('.cta-band');
    const y = await p.evaluate(e => e.getBoundingClientRect().top + scrollY - 80, band);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewportSize({ width: w, height: Math.min(2600, Math.ceil(H - y)) });
    await p.evaluate(y => scrollTo(0, y), y);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `cur-${w}-${theme}.png` });
    await ctx.close();
  }
  await b.close();
})();
