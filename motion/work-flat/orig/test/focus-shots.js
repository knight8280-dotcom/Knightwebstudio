const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(300);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#services').getBoundingClientRect().top + scrollY - 80); });
    await p.focus('#services .kws-arc-link'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(900);   // third item's link
    await p.screenshot({ path: `${__dirname}/../shots/focus-link-${theme}.png`, clip: { x: 240, y: 60, width: 800, height: 560 } });
    await p.focus('#services .kws-arc-dot[aria-current=true]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(900);
    await p.hover('#services .kws-arc-nav:last-child');
    await p.screenshot({ path: `${__dirname}/../shots/focus-dot-hover-next-${theme}.png`, clip: { x: 340, y: 440, width: 600, height: 180 } });
    await ctx.close();
  }
  await b.close();
})();
