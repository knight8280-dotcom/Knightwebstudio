// Takes the screenshots in ../shots/ (the ones this kit's notes refer to).   node final-shots.js [--resume]
const { chromium } = require('playwright');
const fs = require('fs');
const RESUME = process.argv.includes('--resume');   // keep the shots already taken
const B = 'http://localhost:8730/kit/closing/', OUT = __dirname + '/../shots/';
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const open = async (url, w, theme, o = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: o.h || (w < 700 ? 844 : 900) }, deviceScaleFactor: o.dpr || (w < 700 ? 2 : 1), colorScheme: theme, reducedMotion: o.reduce ? 'reduce' : 'no-preference', javaScriptEnabled: !o.nojs });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('kws-motion', 'on'); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    if (o.noshader) await p.route('**/shader.js', r => r.abort());
    await p.goto(B + url, { waitUntil: 'networkidle' });
    if (!o.nojs) await p.evaluate(() => document.fonts.ready);
    if (!o.nojs) await p.addStyleTag({ content: 'html{scroll-behavior:auto !important} .demo-bar{position:static !important} .reveal{opacity:1 !important;transform:none !important}' });
    return p;
  };
  // the end of a page: the last `above` px before the footer, and the footer
  const end = async (name, url, w, theme, above, o = {}) => {
    if (RESUME && fs.existsSync(OUT + name + '.png')) return;
    const p = await open(url, w, theme, o);
    const fh = await p.evaluate(() => Math.ceil(document.querySelector('body > footer, footer.kws-foot').getBoundingClientRect().height));
    const vh = Math.min(fh + above, 3200);
    await p.setViewportSize({ width: w, height: vh });
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(o.noshader || o.nojs ? 400 : 1600);
    await p.screenshot({ path: OUT + name + '.png' });
    await p.context().close();
  };
  // one element of the demo page
  const part = async (name, url, sel, nth, w, theme, o = {}) => {
    if (RESUME && fs.existsSync(OUT + name + '.png')) return;
    const p = await open(url, w, theme, o);
    const el = p.locator(sel).nth(nth);
    const h = await el.evaluate(e => Math.ceil(e.getBoundingClientRect().height));
    await p.setViewportSize({ width: w, height: Math.max(700, Math.min(h + 200, 3200)) });
    await el.evaluate((e, top) => scrollTo(0, e.getBoundingClientRect().top + scrollY - top), o.top || 40);
    await p.waitForTimeout(o.noshader ? 300 : 1600);
    const box = await el.boundingBox();
    await p.screenshot({ path: OUT + name + '.png', clip: { x: 0, y: Math.max(0, box.y - (o.top || 40)), width: w, height: Math.min(box.height + (o.top || 40) + (o.bottom || 0), 3200) } });
    await p.context().close();
  };

  // 1. Real pages with the kit in place
  for (const theme of ['light', 'dark']) {
    await end(`pricing-end-1440-${theme}`, 'test/pricing-with-kit.html', 1440, theme, 640);
    await end(`pricing-end-390-${theme}`, 'test/pricing-with-kit.html', 390, theme, 900);
  }
  await end('pricing-end-1920-light', 'test/pricing-with-kit.html', 1920, 'light', 640);
  await end('pricing-end-820-dark', 'test/pricing-with-kit.html', 820, 'dark', 760);
  await end('pricing-end-360-light', 'test/pricing-with-kit.html', 360, 'light', 880, { dpr: 1 });
  await end('start-end-390-dark', 'test/start-with-kit.html', 390, 'dark', 900);
  await end('start-end-1440-light', 'test/start-with-kit.html', 1440, 'light', 600);
  await end('notfound-1440-dark', 'test/notfound-with-kit.html', 1440, 'dark', 520);
  await end('notfound-390-light', 'test/notfound-with-kit.html', 390, 'light', 700);
  await end('pricing-end-390-light-script-off', 'test/pricing-with-kit.html', 390, 'light', 900, { nojs: true });
  await end('pricing-end-1440-dark-reduced-motion', 'test/pricing-with-kit.html', 1440, 'dark', 640, { reduce: true });

  // 2. The three bands, still (CSS only) and with the shader live
  const bands = [['strip', 0], ['card', 1], ['statement', 3]];
  for (const [n, i] of bands) for (const w of [1440, 390]) {
    await part(`band-${n}-${w}-light-still`, 'demo.html', '.kws-close', i, w, 'light', { noshader: true });
    await part(`band-${n}-${w}-dark-live`, 'demo.html', '.kws-close', i, w, 'dark');
  }
  await part('band-statement-1440-light-live', 'demo.html', '.kws-close', 3, 1440, 'light');
  await part('card-alone-1440-light', 'demo.html', '.split-even', 0, 1440, 'light', { noshader: true });
  await part('card-alone-390-dark', 'demo.html', '.split-even', 0, 390, 'dark', { noshader: true });

  // 3. The slim footers, the client palette, the bare page
  for (const w of [1440, 390]) {
    await part(`slim-start-${w}-light`, 'demo.html', '.demo-frame', 0, w, 'light', { top: 8 });
    await part(`slim-bare-${w}-dark`, 'demo.html', '.demo-frame', 1, w, 'dark', { top: 8, noshader: true });
    await part(`client-brand-${w}`, 'demo.html', '.demo-frame', 2, w, 'light', { top: 8 });
    await end(`portable-end-${w}`, 'portable.html', w, 'light', w < 700 ? 760 : 560);
  }

  // 4. The scene: still against live, and three moments of the name rising on a phone
  for (const [n, o] of [['still', { noshader: true }], ['live', {}]]) {
    const p = await open('test/pricing-with-kit.html', 1440, 'dark', o);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(o.noshader ? 400 : 2200);
    const box = await p.locator('.kws-skyline').boundingBox();
    await p.screenshot({ path: OUT + `scene-${n}-1440-dark.png`, clip: { x: 0, y: box.y - 30, width: 1440, height: box.height + 30 } });
    await p.context().close();
  }
  {
    const p = await open('test/pricing-with-kit.html', 390, 'dark', { noshader: true, dpr: 2 });
    const top = await p.evaluate(() => { const s = document.querySelector('.kws-skyline'); return s.getBoundingClientRect().top + scrollY; });
    const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    let k = 0;
    for (const y of [top - 844 + 28, top - 844 + 62, max]) {
      await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(300);
      await p.screenshot({ path: OUT + `rise-390-${++k}.png`, clip: { x: 0, y: 844 - 150, width: 390, height: 150 } });
    }
    await p.context().close();
  }

  // 5. Focus rings
  {
    const p = await open('test/pricing-with-kit.html', 1440, 'light', { noshader: true });
    for (const [n, sel] of [['band-button', '.kws-close-btn'], ['card-button', '.kws-appt-btn'], ['footer-number', '.kws-foot-tel'], ['footer-go', '.kws-foot-go']]) {
      await p.focus(sel); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
      const box = await p.locator(sel).first().boundingBox();
      await p.screenshot({ path: OUT + `focus-${n}.png`, clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 30), width: box.width + 80, height: box.height + 60 } });
    }
    await p.context().close();
  }
  await b.close();
  console.log('shots written to', OUT);
})();
