const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', colorScheme: theme, deviceScaleFactor: 2 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    // focus by keyboard: focus previous element then Tab
    await p.focus('#c-rate'); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(250);
    await p.screenshot({ path: `focus-cjob-${theme}.png` });
    await p.focus('#c-quotes'); await p.keyboard.press('Tab'); await p.waitForTimeout(250); // c-quotewin
    await p.screenshot({ path: `focus-quotewin-${theme}.png` });
    if (theme === 'light') { await p.focus('#growth-calc .receipt .btn'); await p.keyboard.press('Tab'); await p.waitForTimeout(300); await p.screenshot({ path: `focus-freecheck.png` });
      await p.focus('.price-strip'); await p.keyboard.press('Tab'); await p.waitForTimeout(300); await p.screenshot({ path: `focus-toc.png` }); }
    await ctx.close();
  }
  await b.close();
})();
