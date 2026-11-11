const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 664 }, { width: 820, height: 1180 }, { width: 640, height: 400 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true });
    await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
    await p.locator('.footer-links a').last().focus();
    let bad = 0, n = 0;
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(450);
      const f = await p.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null; const r = el.getBoundingClientRect(); const header = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const barOn = getComputedStyle(bar).display !== 'none' && bar.classList.contains('show'); const top = Math.max(0, header.bottom), bot = barOn ? bar.getBoundingClientRect().top : innerHeight; const chrome = !!el.closest('.site-header,.topbar,.mobile-cta,.skip-link'); const visH = Math.max(0, Math.min(r.bottom, bot) - Math.max(r.top, top)); return { n: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 28), top: Math.round(r.top), bottom: Math.round(r.bottom), lim: [Math.round(top), Math.round(bot)], chrome, hiddenFrac: chrome ? 0 : +(1 - visH / r.height).toFixed(2), bar: barOn && !!el.closest('.mobile-cta') }; });
      if (!f) break; n++; if (f.hiddenFrac > 0) { bad++; console.log(`  ${vp.width}x${vp.height} PARTLY/FULLY HIDDEN`, JSON.stringify(f)); } if (f.n.startsWith('Skip')) break;
    }
    console.log(`${vp.width}x${vp.height}: ${n} stops backwards, ${bad} obscured`);
    await ctx.close();
  }
  await b.close();
})();
