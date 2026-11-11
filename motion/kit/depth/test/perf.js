// Frame times at 390x844 with the CPU throttled (4x by default; 1 for reference), and the time spent inside the kit's own
// frame callbacks. Each interaction is recorded frame by frame from just before it starts until the component is at rest.
//   node test/perf.js [url] [rate] [rounds]
const { engine, DEMO, finger, line } = require('./lib');
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
const stats = t => { const d = t.slice(1).map((x, i) => x - t[i]); return d.length ? `${String(d.length).padStart(3)} frames, mean ${(d.reduce((a, c) => a + c, 0) / d.length).toFixed(1)}ms, median ${pct(d, .5).toFixed(1)}, 95th ${pct(d, .95).toFixed(1)}, worst ${Math.max(...d).toFixed(1)}; over 20ms: ${d.filter(x => x > 20).length}, over 34ms: ${d.filter(x => x > 34).length}` : 'no frames'; };
(async () => {
  const url = process.argv[2] || DEMO, rate = +(process.argv[3] || 4), rounds = +(process.argv[4] || 3);
  const b = await engine('chromium').launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (let round = 0; round < rounds; round++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await ctx.addInitScript(() => { window.__cost = []; window.__busy = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => /kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack) ? (window.__busy++, r.call(window, t => { window.__busy--; const a = performance.now(); f(t); window.__cost.push(performance.now() - a); })) : r.call(window, f); });
    const p = await ctx.newPage(); p.ctx = ctx; await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const cdp = p.cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    // records every frame until the kit has asked for none for a while
    const record = () => p.evaluate(() => new Promise(done => { const t = []; let quiet = 0, seen = false; const loop = now => { t.push(now); if (window.__busy > 0) { seen = true; quiet = 0; } else if (seen && ++quiet > 6) return done(t.slice(0, t.length - 6)); else if (!seen && ++quiet > 400) return done([]); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }));
    const cost = async () => { const c = await p.evaluate(() => window.__cost.splice(0)); return c.length ? `; script per frame: mean ${(c.reduce((a, x) => a + x, 0) / c.length).toFixed(2)}ms, worst ${Math.max(...c).toFixed(2)}ms` : ''; };
    const go = (sel, off) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);
    const has = sel => p.evaluate(s => !!document.querySelector(s), sel);
    if (await has('.kws-cyl')) {
      const C = '.kws-cyl'; await go(C, -70); await p.waitForTimeout(600); await cost();
      let rec = record(); await p.waitForTimeout(80); await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), C); let t = await rec;
      console.log(`${rate}x  drum, Next button:          ${stats(t)}${await cost()}`);
      await p.waitForTimeout(300);
      const box = await p.locator(`${C} .kws-cyl-track`).first().boundingBox(); const x = 195, y = box.y + 260;
      rec = record(); await p.waitForTimeout(80);
      await finger(p, Array.from({ length: 41 }, (_, i) => [x - 150 * Math.sin(i / 40 * Math.PI * 1.5), y + 2])); t = await rec;
      console.log(`${rate}x  drum, touch drag and settle: ${stats(t)}${await cost()}`);
      await p.waitForTimeout(400);
    }
    const R = '.kws-ring'; await go(R, -720); await p.waitForTimeout(700); await cost();
    let rec = record();
    for (let k = 0; k < 2; k++) { await finger(p, line(60, 760, 60, 760 - 45 * 12, 45)); await p.waitForTimeout(40); }
    let t = await rec;
    console.log(`${rate}x  ring, two swipes that scroll the page past it: ${stats(t)}${await cost()}`);
    await go(R, -70); await p.waitForTimeout(1500); await cost();
    const sb = await p.locator(`${R} .kws-ring-stage`).first().boundingBox(); const sx = 195, sy = sb.y + sb.height * .75;
    rec = record(); await p.waitForTimeout(80);
    await finger(p, Array.from({ length: 41 }, (_, i) => [sx - 140 * Math.sin(i / 40 * Math.PI * 1.5), sy + 2])); t = await rec;
    console.log(`${rate}x  ring, touch drag, coast and settle:            ${stats(t)}${await cost()}`);
    if (round === rounds - 1) console.log(`      at rest: will-change on a drum card "${await p.evaluate(() => { const c = document.querySelector('.kws-cyl-card'); return c ? getComputedStyle(c).willChange : 'n/a'; })}"; the ring keeps ${await p.evaluate(s => document.querySelector(s).querySelectorAll('.kws-ring-card').length, R)} small blank cards and 2 reading cards as layers while on screen, none off screen`);
    await ctx.close();
  }
  await b.close();
})();
