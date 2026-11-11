// Frame times at 390x844, 2x pixels: once unthrottled for reference, then four runs with the CPU throttled 4x. Each run is a fresh page,
// so the first move of each is the first move after load (the one review worried about). Also: nothing runs when idle.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const rate of [1, 4, 4, 4, 4]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await ctx.addInitScript(() => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { window.__raf++; return r.call(window, f); }; });
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spotlight', '#work .kws-spot', '.kws-spot-frame']]) {
      await p.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160); }, sel); await p.waitForTimeout(500);
      // idle: no animation frames asked for in two seconds
      const r0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(2000); const idle = (await p.evaluate(() => window.__raf)) - r0;
      // a watcher that records frame times while the carousel says it is moving
      const record = () => p.evaluate(s => new Promise(done => { const el = document.querySelector(s), t = []; let seen = false, quiet = 0;
        const loop = now => { const m = el.classList.contains('is-moving'); if (m) { seen = true; t.push(now); quiet = 0; } else if (seen && ++quiet > 3) return done(t); else if (!seen && ++quiet > 240) return done(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
      const stats = t => { const d = t.slice(1).map((x, i) => x - t[i]); return d.length ? `${d.length} frames, mean ${(d.reduce((a, c) => a + c, 0) / d.length).toFixed(1)}ms, median ${pct(d, .5).toFixed(1)}ms, 95th ${pct(d, .95).toFixed(1)}ms, worst ${Math.max(...d).toFixed(1)}ms, over 33ms: ${d.filter(x => x > 33.4).length}` : 'no frames'; };
      // 1. the next button: the spring from one item to the next
      let rec = record(); await p.waitForTimeout(60); await p.evaluate(s => document.querySelector(s + ' button:last-of-type').click(), sel); let t = await rec;
      console.log(`${rate}x  ${name.padEnd(9)} next button: ${stats(t)}`);
      await p.waitForTimeout(300);
      // 2. a touch drag across and back, then release
      const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 30;
      rec = record(); await p.waitForTimeout(60);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 40; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 150 * Math.sin(i / 40 * Math.PI * 1.5), y: y + 2, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); t = await rec;
      console.log(`${rate}x  ${name.padEnd(9)} drag + settle: ${stats(t)}`);
      await p.waitForTimeout(400);
      const r1 = await p.evaluate(() => window.__raf); await p.waitForTimeout(1500); const after = (await p.evaluate(() => window.__raf)) - r1;
      console.log(`${rate}x  ${name.padEnd(9)} animation frames requested while idle: ${idle} before, ${after} after use; will-change set while idle: ${await p.evaluate(s => getComputedStyle(document.querySelector(s + ' li.is-on [class$="-tile"], ' + s + ' li.is-on [class$="-frame"]')).willChange, sel)}`);
    }
    await ctx.close();
  }
  await b.close();
})();
