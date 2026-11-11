// The screenshots kept in shots/: each component before, mid-drag and settled, in both themes at 390 and 1440,
// the ring at several points of a scroll, plus the states the contract names.  node test/final-shots.js
const { chromium } = require('playwright');
const DEMO = 'http://localhost:8730/kit/depth/demo.html', OUT = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ channel: 'chromium' });
  const open = async (w, h, theme, o = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1, hasTouch: w < 700, isMobile: w < 700, reducedMotion: o.rm ? 'reduce' : 'no-preference', javaScriptEnabled: o.js !== false });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto(o.url || DEMO, { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    p.cdp = await ctx.newCDPSession(p); return p;
  };
  const at = (p, sel, off) => p.evaluate(([s, o]) => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);
  const shot = (p, name, clip) => clip ? p.locator(clip).first().screenshot({ path: OUT + name + '.png' }) : p.screenshot({ path: OUT + name + '.png' });
  const press = async (p, x, y, dx, steps, release) => { // a held drag: mouse on desktop, a finger on the phone
    if (p.viewportSize().width < 700) {
      await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= steps; i++) { await p.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / steps, y: y + 1, id: 1 }] }); await p.waitForTimeout(16); }
      return () => p.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(x + dx * i / steps, y); await p.waitForTimeout(16); }
    return () => p.mouse.up();
  };

  for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const p = await open(w, h, theme), tag = `${w}-${theme}`;
    // ---- cylinder
    await at(p, '#how .kws-cyl', w < 700 ? -84 : -150); await p.waitForTimeout(500);
    await shot(p, `cylinder-${tag}-1-before`);
    const c = await p.locator('#how .kws-cyl-card.is-on').boundingBox();
    const up = await press(p, c.x + c.width * .7, c.y + 220, -(c.width * .62), 12);
    await p.waitForTimeout(80); await shot(p, `cylinder-${tag}-2-mid-drag`);
    await up(); await p.waitForTimeout(1100); await shot(p, `cylinder-${tag}-3-settled`);
    // ---- ring: three points of a scroll past it, then a drag
    for (const [i, off] of [[1, w < 700 ? -520 : -520], [2, w < 700 ? -330 : -300], [3, w < 700 ? -150 : -110]]) { await at(p, '#included .kws-ring', off); await p.waitForTimeout(900); await shot(p, `ring-${tag}-scroll-${i}`); }
    const s = await p.locator('#included .kws-ring-stage').boundingBox();
    const up2 = await press(p, s.x + s.width * .65, s.y + s.height * .55, -s.width * .3, 14);
    await p.waitForTimeout(60); await shot(p, `ring-${tag}-4-mid-drag`);
    await up2(); await p.waitForTimeout(1500); await shot(p, `ring-${tag}-5-settled`);
    await p.context().close();
  }
  // ---- the client palette
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await open(w, h, 'light');
    await at(p, '#client .kws-cyl', w < 700 ? -84 : -330); await p.waitForTimeout(600); await shot(p, `client-palette-${w}-cylinder`);
    await at(p, '#client .kws-ring', w < 700 ? -100 : -130); await p.waitForTimeout(900); await shot(p, `client-palette-${w}-ring`);
    await p.context().close();
  }
  // ---- script off, reduced motion, small phone, wide screen, tablet
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await open(w, h, 'light', { js: false });
    await at(p, '#how', 0); await shot(p, `script-off-${w}-cylinder`); await at(p, '#included', 0); await shot(p, `script-off-${w}-ring`);
    await p.context().close();
  }
  let p = await open(390, 844, 'light', { rm: true });
  await at(p, '#how .kws-cyl', -84); await p.click('#how .kws-cyl-nav:last-child'); await p.click('#how .kws-cyl-nav:last-child'); await p.waitForTimeout(100); await shot(p, 'reduced-motion-390-cylinder-after-two-nexts');
  await at(p, '#included .kws-ring', -150); await p.waitForTimeout(400); await shot(p, 'reduced-motion-390-ring-still');
  await p.context().close();
  p = await open(360, 740, 'light'); await at(p, '#how .kws-cyl', -84); await p.waitForTimeout(400); await shot(p, 'small-360-cylinder-flat-row');
  await at(p, '#included', 0); await p.waitForTimeout(300); await shot(p, 'small-360-ring-gives-way-to-lists'); await p.context().close();
  p = await open(768, 1024, 'light'); await at(p, '#how .kws-cyl', -160); await p.waitForTimeout(500); await shot(p, 'tablet-768-cylinder'); await at(p, '#included .kws-ring', -120); await p.waitForTimeout(900); await shot(p, 'tablet-768-ring'); await p.context().close();
  p = await open(1920, 1080, 'light'); await at(p, '#how .kws-cyl', -260); await p.waitForTimeout(500); await shot(p, 'wide-1920-cylinder'); await at(p, '#included', -40); await p.waitForTimeout(900); await shot(p, 'wide-1920-ring'); await p.context().close();
  // ---- focus and hover
  for (const theme of ['light', 'dark']) {
    p = await open(1440, 900, theme); await at(p, '#how .kws-cyl', -150); await p.waitForTimeout(400);
    await p.focus('#how .kws-cyl-nav:first-child'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.hover('#how .kws-cyl-nav:last-child'); await p.waitForTimeout(200);
    await shot(p, `focus-dot-hover-next-${theme}`, '#how .kws-cyl-ctl'); await p.context().close();
  }
  await b.close(); console.log('done');
})();
