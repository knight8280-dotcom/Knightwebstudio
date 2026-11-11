// node test/cylcards.js <w> <h> <theme> <prefix> : each card of the first cylinder in the middle, cropped to the component
const { chromium } = require('playwright');
(async () => {
  const [w, h, theme, prefix] = [+process.argv[2] || 390, +process.argv[3] || 664, process.argv[4] || 'light', process.argv[5] || 'c'];
  const out = process.env.OUT || __dirname + '/../shots', sel = process.env.SEL || '#how .kws-cyl';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700, isMobile: w < 700, deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, theme);
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e)); p.on('console', m => m.type() === 'error' && console.log('CON', m.text()));
  await p.goto(process.env.URL || 'http://localhost:8730/kit/depth/demo.html'); await p.waitForTimeout(500);
  await p.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - (innerWidth < 700 ? 64 : 90)); }, sel);
  const n = await p.locator(sel + ' .kws-cyl-dot').count();
  for (let i = 0; i < n; i++) {
    await p.locator(sel + ' .kws-cyl-dot').nth(i).click(); await p.mouse.move(5, 5); await p.waitForTimeout(1100);
    const r = await p.evaluate(s => { const e = document.querySelector(s).getBoundingClientRect(); return { x: 0, y: Math.max(0, e.y), width: innerWidth, height: Math.min(innerHeight - Math.max(0, e.y), e.height) }; }, sel);
    await p.screenshot({ path: `${out}/${prefix}-card${i + 1}.png`, clip: r });
  }
  console.log(await p.evaluate(s => { const e = document.querySelector(s), c = e.querySelector('.kws-cyl-card'), k = e.querySelector('.kws-cyl-ctl'); return { card: c.offsetHeight, root: e.offsetHeight, ctl: [k.offsetWidth, k.offsetHeight], cardW: c.offsetWidth }; }, sel));
  await b.close();
})();
