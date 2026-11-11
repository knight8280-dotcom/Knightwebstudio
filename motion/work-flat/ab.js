// A/B: the spotlight with and without its early layers, alternating fresh pages, CPU throttled 4x, real touch input.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const nowarm = fs.readFileSync(__dirname + '/spotlight-nowarm.js', 'utf8');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const tot = { warm: { late: 0, worst: 0, first: [] }, nowarm: { late: 0, worst: 0, first: [] } };
  for (let k = 0; k < 8; k++) for (const v of ['warm', 'nowarm']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    if (v === 'nowarm') await ctx.route(/\/spotlight\.js/, r => r.fulfill({ contentType: 'text/javascript', body: nowarm }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const sel = '#work .kws-spot';
    await p.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160); }, sel); await p.waitForTimeout(600);
    const rec = p.evaluate(s => new Promise(done => { const el = document.querySelector(s), t = []; let seen = false, quiet = 0;
      const loop = now => { const m = el.classList.contains('is-moving'); if (m) { seen = true; t.push(now); quiet = 0; } else if (seen && ++quiet > 3) return done(t); else if (!seen && ++quiet > 400) return done(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
    const box = await p.locator(`${sel} li.is-on .kws-spot-frame`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 40;
    await p.waitForTimeout(100);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); await p.waitForTimeout(60);
    for (let i = 1; i <= 24; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 6, y, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const t = await rec; const d = t.slice(1).map((q, i) => q - t[i]);
    tot[v].late += d.filter(q => q > 33.4).length; tot[v].worst = Math.max(tot[v].worst, ...d); tot[v].first.push(Math.round(Math.max(...d.slice(0, 4))));
    await ctx.close();
  }
  for (const v in tot) console.log(v.padEnd(7), `late frames in 8 first drags: ${tot[v].late}; worst ${tot[v].worst.toFixed(1)}ms; longest of the first four frames of each drag: ${tot[v].first.join(', ')}ms`);
  await b.close();
})();
