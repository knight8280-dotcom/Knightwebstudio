// Frame times at 390x844 with the CPU throttled 4x (and unthrottled for reference), and the script time spent per frame.
//   node test/perf.js [url]
const { chromium } = require('playwright');
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
const stats = t => { const d = t.slice(1).map((x, i) => x - t[i]); return d.length ? `${d.length} frames, mean ${(d.reduce((a, c) => a + c, 0) / d.length).toFixed(1)}ms, median ${pct(d, .5).toFixed(1)}ms, 95th ${pct(d, .95).toFixed(1)}ms, worst ${Math.max(...d).toFixed(1)}ms, over 33ms: ${d.filter(x => x > 33.4).length}` : 'no frames'; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const rate of [1, 4]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    // time spent inside the kit's own frame callbacks
    await ctx.addInitScript(() => { window.__cost = []; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => /kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack) ? r.call(window, t => { const a = performance.now(); f(t); window.__cost.push(performance.now() - a); }) : r.call(window, f); });
    const p = await ctx.newPage(); await p.goto(process.argv[2] || 'http://localhost:8730/kit/depth/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(700);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const record = sel => p.evaluate(s => new Promise(done => { const el = document.querySelector(s), t = []; let seen = false, quiet = 0;
      const loop = now => { const m = el.classList.contains('is-moving'); if (m) { seen = true; t.push(now); quiet = 0; } else if (seen && ++quiet > 3) return done(t); else if (!seen && ++quiet > 300) return done(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
    const cost = async () => { const c = await p.evaluate(() => window.__cost.splice(0)); return c.length ? `script per frame: mean ${(c.reduce((a, x) => a + x, 0) / c.length).toFixed(2)}ms, worst ${Math.max(...c).toFixed(2)}ms` : ''; };
    const go = (sel, off) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);

    // ---- cylinder
    const C = '.kws-cyl'; await go(C, -90); await p.waitForTimeout(500); await cost();
    let rec = record(C); await p.waitForTimeout(60); await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), C); let t = await rec;
    console.log(`${rate}x  cylinder  next button:    ${stats(t)}; ${await cost()}`);
    await p.waitForTimeout(300);
    const box = await p.locator(`${C} .kws-cyl-card.is-on`).first().boundingBox(); const x = box.x + box.width / 2, y = box.y + 200;
    rec = record(C); await p.waitForTimeout(60);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 40; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 150 * Math.sin(i / 40 * Math.PI * 1.5), y: y + 2, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); t = await rec;
    console.log(`${rate}x  cylinder  drag + settle:  ${stats(t)}; ${await cost()}`);
    await p.waitForTimeout(400);

    // ---- ring: a steady touch scroll past it, then a drag
    const R = '.kws-ring'; await go(R, -700); await p.waitForTimeout(500); await cost();
    rec = record(R);
    // two finger swipes up the screen, about 1,000px of page in all
    for (let k = 0; k < 2; k++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 760, id: 1 }] });
      for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 60, y: 760 - i * 12, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(40);
    }
    t = await rec;
    console.log(`${rate}x  ring      scroll past:    ${stats(t)}; ${await cost()}`);
    await go(R, -150); await p.waitForTimeout(700); await p.waitForFunction(s => !document.querySelector(s).classList.contains('is-moving'), R); await p.waitForTimeout(100); await cost();
    const sb = await p.locator(`${R} .kws-ring-stage`).first().boundingBox(); const sx = sb.x + sb.width / 2, sy = sb.y + sb.height / 2;
    rec = record(R); await p.waitForTimeout(60);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 1 }] });
    for (let i = 1; i <= 40; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx - 140 * Math.sin(i / 40 * Math.PI * 1.5), y: sy + 2, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); t = await rec;
    console.log(`${rate}x  ring      drag + coast:   ${stats(t)}; ${await cost()}`);
    await p.waitForTimeout(600);
    console.log(`${rate}x  will-change while idle: cylinder card "${await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-cyl-card')).willChange, C)}", ring card "${await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-ring-card')).willChange, R)}"; layers the ring keeps while it is on screen: ${await p.evaluate(s => document.querySelector(s).querySelectorAll('.kws-ring-card').length, R)} small cards (none while it is off screen)`);
    await ctx.close();
  }
  await b.close();
})();
