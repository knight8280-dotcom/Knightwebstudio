const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible|calendly|hcaptcha/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('.notes').scrollIntoView({ block: 'center' })); await p.waitForTimeout(700);
    const a = p.locator('.projects a').nth(1); await a.hover(); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const q = document.querySelector('.notes').getBoundingClientRect(); return { x: q.x - 12, y: q.y, width: q.width + 24, height: Math.min(q.height, 480) }; });
    await p.screenshot({ path: `${__dirname}/x/hover-project-${theme}.png`, clip: r });
    const st = await a.evaluate(e => ({ name: getComputedStyle(e.querySelector('.project-name')).color, ico: getComputedStyle(e.querySelector('.ico')).transform }));
    console.log(theme, JSON.stringify(st));
    await ctx.close();
  }
  await b.close();
})();
