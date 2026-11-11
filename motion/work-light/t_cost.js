// What a frame costs: per-layer draw rate, canvas sizes, and time inside the kit's frame callback, with and without 4x CPU throttle.
const { chromium } = require('playwright');
const URL = 'http://localhost:8730/kit/light/demo.html';
const ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), DSF = +(process.argv[4] || 1), THROTTLE = +(process.argv[5] || 4);
(async () => {
  const b = await chromium.launch({ args: ARGS });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  await ctx.addInitScript(() => {
    window.__per = new Map(); window.__cb = [];
    const d = ImageBitmapRenderingContext.prototype.transferFromImageBitmap;
    ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function () { const k = this.canvas; window.__per.set(k, (window.__per.get(k) || 0) + 1); return d.apply(this, arguments); };
    const r = window.requestAnimationFrame;
    window.requestAnimationFrame = function (f) { return r.call(window, function (t) { const a = performance.now(); f(t); const dur = performance.now() - a; if (/frame/.test(f.name)) window.__cb.push(dur); }); };
  });
  const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(2000);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  console.log(`viewport ${W}x${H} @${DSF}x, CPU throttle ${THROTTLE}x`);
  for (const [name, sel] of [['first screen (wash)', '#top'], ['bookmark cards (ribbons)', '#services .kws-marks'], ['step folders', '#process .kws-folders'], ['package stack', '#pricing .kws-folders'], ['other brand', '.demo-brand'], ['closing band', '.cta-band']]) {
    await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); scrollTo({ top: scrollY + r.top - 80, behavior: 'instant' }); }, sel);
    await p.waitForTimeout(2500);
    const res = await p.evaluate(() => new Promise(done => {
      window.__per = new Map(); window.__cb = [];
      const stamps = []; let t0 = performance.now();
      (function tick(t) { stamps.push(t); if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else {
        const d = []; for (let i = 1; i < stamps.length; i++) d.push(stamps[i] - stamps[i - 1]); d.sort((a, b) => a - b);
        const cb = window.__cb.slice().sort((a, b) => a - b);
        const q = (arr, f) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * f))] : 0;
        const layers = [...window.__per.entries()].map(([c, n]) => (c.parentElement ? c.parentElement.getAttribute('data-shader') : '?') + ' ' + c.width + 'x' + c.height + ' ' + (n / 3).toFixed(1) + '/s');
        done({ frames: stamps.length, med: q(d, .5), p95: q(d, .95), max: d[d.length - 1], over50: d.filter(x => x > 50).length, cbMed: q(cb, .5), cbP95: q(cb, .95), cbMax: cb[cb.length - 1] || 0, cbN: cb.length, layers });
      } })(performance.now());
    }));
    console.log(`  ${name}: page frame interval median ${res.med.toFixed(1)}ms, p95 ${res.p95.toFixed(1)}ms, max ${res.max.toFixed(1)}ms, ${res.over50} of ${res.frames} over 50ms | kit frame callback median ${res.cbMed.toFixed(1)}ms, p95 ${res.cbP95.toFixed(1)}ms, max ${res.cbMax.toFixed(1)}ms (${res.cbN} calls)`);
    console.log('     layers drawn: ' + (res.layers.join('; ') || 'none'));
  }
  await b.close();
})();
