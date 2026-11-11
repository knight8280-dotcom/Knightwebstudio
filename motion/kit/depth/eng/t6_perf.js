// 5. Performance at 390x844 (DPR 2), CPU throttled 4x: frame intervals, layout reads inside kit frame callbacks, listener options.
//   node t6_perf.js [url] [rounds]
const { chromium, DEMO, ONE, log } = require('./lib');
const url = process.argv[2] || DEMO, rounds = +(process.argv[3] || 3);
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
const st = t => { const d = t.slice(1).map((x, i) => x - t[i]); return d.length ? { n: d.length, mean: +(d.reduce((a, c) => a + c, 0) / d.length).toFixed(1), med: +pct(d, .5).toFixed(1), p95: +pct(d, .95).toFixed(1), worst: +Math.max(...d).toFixed(1), over33: d.filter(x => x > 33.4).length, over50: d.filter(x => x > 50.1).length } : { n: 0 }; };
const fmt = s => s.n ? `${s.n} frames, median ${s.med}ms, mean ${s.mean}ms, 95th ${s.p95}ms, worst ${s.worst}ms, over 33ms: ${s.over33}, over 50ms: ${s.over50}` : 'no frames';
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const rate of [1, 4]) for (let round = 0; round < (rate === 1 ? 1 : rounds); round++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await ctx.addInitScript(() => {
      window.__cost = []; window.__reads = {}; window.__inKit = 0; window.__listeners = [];
      const r = window.requestAnimationFrame; window.requestAnimationFrame = f => /kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack) ? r.call(window, t => { const a = performance.now(); window.__inKit++; try { f(t); } finally { window.__inKit--; } window.__cost.push(performance.now() - a); }) : r.call(window, f);
      const note = k => { if (window.__inKit) window.__reads[k] = (window.__reads[k] || 0) + 1; };
      for (const k of ['offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft']) { const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, k); Object.defineProperty(HTMLElement.prototype, k, { get() { note(k); return d.get.call(this); }, configurable: true }); }
      for (const k of ['clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight', 'scrollTop', 'scrollLeft']) { const d = Object.getOwnPropertyDescriptor(Element.prototype, k); Object.defineProperty(Element.prototype, k, { get() { note(k); return d.get.call(this); }, set: d.set ? function (v) { note(k + '='); d.set.call(this, v); } : undefined, configurable: true }); }
      const g = Element.prototype.getBoundingClientRect; Element.prototype.getBoundingClientRect = function () { note('getBoundingClientRect'); return g.call(this); };
      const gcs = window.getComputedStyle; window.getComputedStyle = function (...a) { note('getComputedStyle'); return gcs.apply(window, a); };
      for (const k of ['scrollY', 'scrollX', 'innerHeight', 'innerWidth', 'pageYOffset']) { const d = Object.getOwnPropertyDescriptor(window, k) || Object.getOwnPropertyDescriptor(Window.prototype, k); if (d && d.get) Object.defineProperty(window, k, { get() { note('window.' + k); return d.get.call(window); }, configurable: true }); }
      const ael = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function (type, fn, opt) { if (/kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack)) window.__listeners.push((this === window ? 'window' : this.className ? '.' + String(this.className).split(' ')[0] : this.nodeName) + ' ' + type + ' ' + (opt && typeof opt === 'object' ? (opt.passive ? 'passive' : 'NOT-passive') + (opt.capture ? ' capture' : '') : 'default')); return ael.call(this, type, fn, opt); };
    });
    const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const record = sel => p.evaluate(s => new Promise(done => { const el = document.querySelector(s), t = []; let seen = false, quiet = 0; const loop = now => { const m = el.classList.contains('is-moving'); if (m) { seen = true; t.push(now); quiet = 0; } else if (seen && ++quiet > 3) return done(t); else if (!seen && ++quiet > 300) return done(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
    const cost = async () => { const c = await p.evaluate(() => window.__cost.splice(0)); return c.length ? `kit script per frame: mean ${(c.reduce((a, x) => a + x, 0) / c.length).toFixed(2)}ms, worst ${Math.max(...c).toFixed(2)}ms` : ''; };
    const go = (sel, off) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);
    const tag = `${rate}x${rate > 1 ? ' run ' + (round + 1) : ''}`;
    if (await p.$('.kws-cyl')) {
      const C = '.kws-cyl'; await go(C, -90); await p.waitForTimeout(500); await cost();
      let rec = record(C); await p.waitForTimeout(60); await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), C); let t = await rec;
      log(`${tag}  cylinder  Next button:        ${fmt(st(t))}; ${await cost()}`);
      await p.waitForTimeout(300);
      const box = await p.locator(`${C} .kws-cyl-card.is-on`).first().boundingBox(); const x = box.x + box.width / 2, y = box.y + 200;
      rec = record(C); await p.waitForTimeout(60);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 50; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 150 * Math.sin(i / 50 * Math.PI * 1.5), y: y + 2, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); t = await rec;
      log(`${tag}  cylinder  touch drag + settle: ${fmt(st(t))}; ${await cost()}`);
      await p.waitForTimeout(400);
    }
    const R = '.kws-ring'; await go(R, -700); await p.waitForTimeout(500); await cost();
    let rec = record(R);
    for (let k = 0; k < 2; k++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 760, id: 1 }] });
      for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 60, y: 760 - i * 12, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(40);
    }
    let t = await rec;
    log(`${tag}  ring      scroll past (touch): ${fmt(st(t))}; ${await cost()}`);
    await go(R, -150); await p.waitForTimeout(700); await p.waitForFunction(s => !document.querySelector(s).classList.contains('is-moving'), R); await p.waitForTimeout(100); await cost();
    const sb = await p.locator(`${R} .kws-ring-stage`).first().boundingBox(); const sx = sb.x + sb.width / 2, sy = sb.y + sb.height / 2;
    rec = record(R); await p.waitForTimeout(60);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 1 }] });
    for (let i = 1; i <= 50; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx - 140 * Math.sin(i / 50 * Math.PI * 1.5), y: sy + 2, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); t = await rec;
    log(`${tag}  ring      touch drag + coast:  ${fmt(st(t))}; ${await cost()}`);
    if (rate === 4 && round === 0) {
      log(`     layout-reading calls made inside the kit's frame callbacks in this whole run: ${JSON.stringify(await p.evaluate(() => window.__reads))}`);
      const ls = await p.evaluate(() => window.__listeners); const uniq = {}; ls.forEach(l => uniq[l] = (uniq[l] || 0) + 1);
      log('     listeners the kit added: ' + Object.entries(uniq).map(([k, v]) => `${k} x${v}`).join('; '));
    }
    await ctx.close();
  }
  await b.close();
})();
