const { chromium } = require('playwright');
(async () => {
  const [base, out] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const [name, w, h, theme, y] of [['1-home-desktop', 1440, 900, 'light', 0], ['2-home-desktop-night', 1440, 900, 'dark', 0], ['3-home-phone', 390, 844, 'light', 0], ['4-price-board', 1440, 900, 'light', 'price']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: theme, isMobile: w < 500, hasTouch: w < 500 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(base + '/', { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    if (y === 'price') { await p.evaluate(() => { const e = document.querySelector('#pricing'); if (e) e.scrollIntoView({ block: 'start', behavior: 'instant' }); }); await p.waitForTimeout(1200); }
    await p.screenshot({ path: `${out}/${name}.png` });
    await ctx.close();
  }
  await b.close();
})();
