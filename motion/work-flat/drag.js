// Working aid: node drag.js <prefix> <width> <height> <light|dark> <selector> <dx1,dx2,...> [touch]
// Presses in the middle of the picture part, drags to each dx in turn (a shot at each), lets go, and shoots 80ms, 200ms and 1s later.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const [prefix, w, h, theme, sel, dxs, yoff = '70'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +w < 700 ? 2 : 1 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 100); }, sel);
  await p.waitForTimeout(300);
  const r = await p.locator(sel + ' ul').first().boundingBox(), x0 = r.x + r.width / 2, y0 = r.y + +yoff;
  const clip = { x: 0, y: Math.max(0, r.y - 60), width: +w, height: Math.min(+h - Math.max(0, r.y - 60), r.height + 160) };
  await p.mouse.move(x0, y0); await p.mouse.down(); let x = x0;
  for (const d of dxs.split(',').map(Number)) {
    const tx = x0 + d; const n = Math.max(2, Math.round(Math.abs(tx - x) / 12));
    for (let i = 1; i <= n; i++) { await p.mouse.move(x + (tx - x) * i / n, y0); await p.waitForTimeout(16); }
    x = tx; await p.waitForTimeout(120);
    await p.screenshot({ path: `${prefix}-drag${d}.png`, clip });
  }
  await p.waitForTimeout(150); await p.mouse.up();
  await p.waitForTimeout(80); await p.screenshot({ path: `${prefix}-rel080.png`, clip });
  await p.waitForTimeout(120); await p.screenshot({ path: `${prefix}-rel200.png`, clip });
  await p.waitForTimeout(900); await p.screenshot({ path: `${prefix}-settled.png`, clip });
  console.log(await p.evaluate(s => [...document.querySelector(s).querySelectorAll('li')].findIndex(li => li.classList.contains('is-on')), sel));
  await b.close();
})();
