// Takes the screenshots in shots/: at rest in both themes and several widths, in the middle of a drag, hover and focus,
// script off, the held state, the client palette and the bare page. Look at them after any change to the look.
const { chromium, BASE } = require('./lib');
const OUT = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch();
  const page = async (w, h, theme, o = {}, file = 'demo.html') => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 }, o));
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto(BASE + file, { waitUntil: 'load' }); await p.waitForTimeout(600);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    return { ctx, p };
  };
  const to = async (p, sel, top = 90) => { await p.evaluate(([s, t]) => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - t); }, [sel, top]); await p.waitForTimeout(300); };
  // 1. at rest
  for (const theme of ['light', 'dark']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, p } = await page(w, h, theme);
    for (const [name, sel] of [['wheel', '#services .kws-arc'], ['spotlight', '#work .kws-spot'], ['client-wheel', '#client .kws-arc'], ['client-spotlight', '#client .kws-spot']]) { await to(p, sel, w < 700 ? 90 : 130); await p.screenshot({ path: `${OUT}rest-${w}-${theme}-${name}.png` }); }
    await ctx.close();
  }
  for (const w of [360, 430, 600, 768, 1024, 1920]) {
    const { ctx, p } = await page(w, 860, 'light');
    await to(p, '#services .kws-arc', 100); await p.screenshot({ path: `${OUT}rest-${w}-light-wheel.png` });
    await to(p, '#work .kws-spot', 100); await p.screenshot({ path: `${OUT}rest-${w}-light-spotlight.png` });
    await ctx.close();
  }
  // 2. in the middle of a drag, and letting go
  for (const [name, sel, w, h, theme, stops, yoff] of [['wheel', '#services .kws-arc', 390, 844, 'light', [-40, -110], 60], ['wheel', '#services .kws-arc', 1440, 900, 'dark', [-90, -260], 70],
    ['spotlight', '#work .kws-spot', 390, 844, 'light', [-40, -100, -170], 80], ['spotlight', '#work .kws-spot', 390, 844, 'dark', [-100, -170], 80], ['spotlight', '#work .kws-spot', 1440, 900, 'light', [-150, -330], 150]]) {
    const { ctx, p } = await page(w, h, theme); await to(p, sel, 110);
    const r = await p.locator(sel + ' > ul').boundingBox(), x0 = r.x + r.width / 2, y0 = r.y + yoff; let x = x0;
    await p.screenshot({ path: `${OUT}drag-${name}-${w}-${theme}-0-before.png` });
    await p.mouse.move(x0, y0); await p.mouse.down();
    for (const [k, d] of stops.entries()) { const tx = x0 + d, n = Math.max(2, Math.round(Math.abs(tx - x) / 12)); for (let i = 1; i <= n; i++) { await p.mouse.move(x + (tx - x) * i / n, y0); await p.waitForTimeout(16); } x = tx; await p.waitForTimeout(120); await p.screenshot({ path: `${OUT}drag-${name}-${w}-${theme}-${k + 1}-at${-d}px.png` }); }
    await p.mouse.up(); await p.waitForTimeout(90); await p.screenshot({ path: `${OUT}drag-${name}-${w}-${theme}-8-let-go-90ms.png` });
    await p.waitForTimeout(1000); await p.mouse.move(5, 5); await p.waitForTimeout(100); await p.screenshot({ path: `${OUT}drag-${name}-${w}-${theme}-9-settled.png` });
    await ctx.close();
  }
  // 3. hover, pressed and keyboard focus
  for (const theme of ['light', 'dark']) {
    const { ctx, p } = await page(1440, 900, theme);
    for (const [name, sel, part, link] of [['wheel', '#services .kws-arc', '.kws-arc-tile', '.kws-arc-link'], ['spotlight', '#work .kws-spot', '.kws-spot-frame', '.kws-spot-link']]) {
      await to(p, sel, 130); const shot = async (what, clip) => p.screenshot({ path: `${OUT}state-${name}-${theme}-${what}.png`, clip });
      const stage = await p.locator(sel).boundingBox(), clip = { x: 200, y: Math.max(0, stage.y - 40), width: 1040, height: Math.min(900 - Math.max(0, stage.y - 40), stage.height + 80) };
      const side = await p.locator(`${sel} li >> nth=1 >> ${part}`).boundingBox(); await p.mouse.move(side.x + side.width / 2, side.y + side.height / 2); await p.waitForTimeout(150); await shot('hover-side', clip);
      const mid = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); await p.mouse.move(mid.x + mid.width / 2, mid.y + mid.height / 2); await p.waitForTimeout(150); await shot('hover-middle', clip);
      await p.mouse.down(); await p.waitForTimeout(100); await shot('pressed-middle', clip); await p.mouse.move(5, 5); await p.mouse.up(); await p.waitForTimeout(300);
      await p.focus(`${sel} li.is-on ${link}`); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await to(p, sel, 130); await shot('focus-link', clip);
      await p.focus(`${sel} [aria-label^="Next"]`); await p.keyboard.press('Shift+Tab'); await to(p, sel, 130); await shot('focus-dot', clip);
    }
    for (const [name, sel, link] of [['client-wheel', '#client .kws-arc', '.kws-arc-link'], ['client-spotlight', '#client .kws-spot', '.kws-spot-link']]) {
      await to(p, sel, 130); await p.focus(`${sel} li.is-on ${link}`); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await to(p, sel, 130); await p.screenshot({ path: `${OUT}state-${name}-${theme}-focus-link.png` });
    }
    await ctx.close();
  }
  // 4. script off, the held state, reduced motion, the bare page
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const { ctx, p } = await page(w, h, theme, { javaScriptEnabled: false });
    await to(p, '#services', 0); await p.screenshot({ path: `${OUT}script-off-${w}-${theme}-services.png`, fullPage: w > 700 ? false : false });
    await to(p, '#work', 0); await p.screenshot({ path: `${OUT}script-off-${w}-${theme}-work.png` });
    await ctx.close();
  }
  { const { ctx, p } = await page(1440, 2600, 'light', { javaScriptEnabled: false }); await p.screenshot({ path: `${OUT}script-off-1440-light-whole.png`, fullPage: false }); await ctx.close(); }
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, p } = await page(w, h, 'light', { reducedMotion: 'reduce' });
    await to(p, '#services .kws-arc', 100); await p.click('#services [aria-label^="Next"]'); await p.screenshot({ path: `${OUT}reduced-motion-${w}-wheel-after-next.png` });
    await to(p, '#work .kws-spot', 100); await p.click('#work [aria-label^="Next"]'); await p.screenshot({ path: `${OUT}reduced-motion-${w}-spotlight-after-next.png` });
    await ctx.close();
  }
  for (const [w, h] of [[390, 844], [1280, 900]]) {
    const { ctx, p } = await page(w, h, 'light', {}, 'test/bare.html');
    await p.screenshot({ path: `${OUT}bare-${w}-wheel.png` }); await to(p, '.kws-spot', 110); await p.screenshot({ path: `${OUT}bare-${w}-spotlight.png` });
    await ctx.close();
  }
  await b.close(); console.log('shots written');
})();
