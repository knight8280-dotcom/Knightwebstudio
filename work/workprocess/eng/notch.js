const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: theme, reducedMotion: 'reduce' }); await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/process/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    const box = await p.evaluate(() => { const li = document.querySelectorAll('.steps > li')[1]; li.scrollIntoView({ block: 'center' }); const r = li.getBoundingClientRect(); const t = document.querySelector('.ticket').getBoundingClientRect(); return { x: t.left - 14, y: r.top - 40, w: 110, h: 80, x2: t.right - 96 }; });
    await p.screenshot({ path: `snaps/notch_${theme}_L.png`, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
    await p.screenshot({ path: `snaps/notch_${theme}_R.png`, clip: { x: box.x2, y: box.y, width: box.w, height: box.h } });
    // stamp corner
    const sb = await p.evaluate(() => { const s = document.querySelector('.stamp'); s.scrollIntoView({ block: 'center' }); const r = s.getBoundingClientRect(); return { x: Math.max(0, r.left - 120), y: r.top - 70, w: 390 - Math.max(0, r.left - 120), h: 150 }; });
    await p.screenshot({ path: `snaps/stamp_${theme}.png`, clip: { x: sb.x, y: sb.y, width: sb.w, height: sb.h } });
    await ctx.close();
  }
  await b.close();
})();
