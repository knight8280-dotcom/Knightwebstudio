// node test/ringmotion.js <w> <h> <theme> <prefix> : frames of the ring while the page scrolls, during a drag, and at hand-over
const { chromium } = require('playwright');
(async () => {
  const [w, h, theme, prefix] = [+process.argv[2] || 1440, +process.argv[3] || 900, process.argv[4] || 'light', process.argv[5] || 'm'];
  const out = process.env.OUT || __dirname + '/../shots';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700, isMobile: w < 700, deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, theme);
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e)); p.on('console', m => m.type() === 'error' && console.log('CON', m.text()));
  await p.goto('http://localhost:8730/kit/depth/demo.html'); await p.waitForTimeout(400);
  const top = await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('#included .kws-ring-stage'); return e.getBoundingClientRect().top + scrollY; });
  const clip = async name => { const r = await p.evaluate(() => { const e = document.querySelector('#included .kws-ring-stage').getBoundingClientRect(); return { x: Math.max(0, e.x), y: Math.max(0, e.y), width: Math.min(innerWidth, e.right) - Math.max(0, e.x), height: Math.min(innerHeight, e.bottom) - Math.max(0, e.y) }; }); await p.screenshot({ path: `${out}/${prefix}-${name}.png`, clip: r }); };
  await p.evaluate(y => scrollTo(0, y), top - 90); await p.waitForTimeout(1200); await clip('0-rest');
  // scroll in small steps and catch frames mid-turn
  for (let i = 1; i <= 6; i++) { await p.evaluate(y => scrollTo(0, y), top - 90 + i * 18); await p.waitForTimeout(50); if (i % 2 === 0) await clip('1-scroll-' + i); }
  await p.waitForTimeout(1500); await clip('2-settled');
  const box = await p.evaluate(() => { const e = document.querySelector('#included .kws-ring-stage').getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height * .8 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(box.x - i * 12, box.y, { steps: 1 }); await p.waitForTimeout(30); if (i === 4 || i === 8) await clip('3-drag-' + i); }
  await p.mouse.up(); await p.waitForTimeout(60); await clip('4-released-60ms'); await p.waitForTimeout(140); await clip('4-released-200ms'); await p.waitForTimeout(1600); await clip('5-settled');
  await b.close();
})();
