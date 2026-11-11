// The final set: both carousels at 390x844 and 1440x900, light and dark, before / mid-drag / settled, plus the special states.
const { chromium } = require('playwright');
const URL = 'http://localhost:8730/kit/flat/demo.html', OUT = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch();
  const page = async (w, h, theme, extra = {}) => { const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 }, extra));
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto(extra.url || URL, { waitUntil: 'load' }); await p.waitForTimeout(400); return { ctx, p }; };
  const at = (p, sel, off) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY + o); }, [sel, off]);
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const { ctx, p } = await page(w, h, theme);
    for (const [name, sec, list, off] of [['arc', '#services', '.kws-arc-list', w < 700 ? -70 : -90], ['spotlight', '#work', '.kws-spot-list', w < 700 ? 150 : -10]]) {
      await at(p, sec, off); await p.waitForTimeout(500);
      const shot = s => p.screenshot({ path: `${OUT}${name}-${w}-${theme}-${s}.png` });
      await shot('1-before');
      const box = await p.locator(`${sec} ${list}`).boundingBox(); const cx = box.x + box.width / 2, cy = box.y + 70, dist = Math.min(box.width * .28, 240);
      await p.mouse.move(cx, cy); await p.mouse.down();
      for (let i = 1; i <= 12; i++) { await p.mouse.move(cx - dist * i / 12, cy + (i % 2)); await p.waitForTimeout(16); }
      await p.waitForTimeout(120); await shot('2-mid-drag');
      for (let i = 1; i <= 3; i++) { await p.mouse.move(cx - dist - 10 * i, cy); await p.waitForTimeout(16); }
      await p.mouse.up(); await p.waitForTimeout(1100); await shot('3-settled');
    }
    if (theme === 'light') { await at(p, '#client', 0); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}client-palette-${w}-wheel.png` });
      await at(p, '#client .demo-gap', w < 700 ? 60 : -90); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}client-palette-${w}-spotlight.png` }); }
    await ctx.close();
  }
  // script off
  for (const [w, h] of [[390, 844], [1440, 900]]) { const { ctx, p } = await page(w, h, 'light', { javaScriptEnabled: false });
    await at(p, '#services', -70); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}script-off-${w}-services.png` });
    await at(p, '#work', -10); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}script-off-${w}-work.png` }); await ctx.close(); }
  // reduced motion: after pressing next twice (no animation, complete)
  { const { ctx, p } = await page(390, 844, 'light', { reducedMotion: 'reduce' }); await at(p, '#services', -70);
    await p.click('#services .kws-arc-nav:last-child'); await p.click('#services .kws-arc-nav:last-child'); await p.screenshot({ path: `${OUT}reduced-motion-390-arc-after-two-nexts.png` }); await ctx.close(); }
  // tablet and wide
  for (const [w, h] of [[768, 1024], [1920, 1080]]) { const { ctx, p } = await page(w, h, 'light');
    await at(p, '#services', -90); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}arc-${w}-light.png` });
    await at(p, '#work', -10); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}spotlight-${w}-light.png` }); await ctx.close(); }
  // the bare page (no site CSS or JS)
  for (const w of [390, 1280]) { const { ctx, p } = await page(w, 1500, 'light', { url: 'http://localhost:8730/kit/flat/test/bare.html' }); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}bare-page-${w}.png` }); await ctx.close(); }
  await b.close(); console.log('done');
})();
