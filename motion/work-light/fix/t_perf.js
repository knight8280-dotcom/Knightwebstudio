// Frame times with the CPU throttled 4x, backgrounds running against paused, passes alternated so machine noise falls on both.
// node t_perf.js 390 844 3   |   node t_perf.js 1440 900 1
const { chromium } = require('/opt/node-tools/node_modules/playwright'); const os = require('os');
const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), DSF = +(process.argv[4] || 3), PASSES = +(process.argv[5] || 3);
const POS = [['first screen (wash)', 'body', 0], ['bookmark cards (ribbons)', '#services .kws-marks', 110], ['step folders (one ribbon strip)', '#process .kws-folders', 110], ['folder stack (no canvas)', '#pricing .kws-folders', 110], ['second brand (wash, ribbons, band)', '.demo-brand', 90], ['closing band (band, glints)', '.cta-band', 110]];
const q = (s, p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  console.log(`viewport ${W}x${H} at ${DSF}x, CPU throttled 4x, ${PASSES} passes of 3s each way, load ${os.loadavg()[0].toFixed(1)}`);
  const pages = {};
  for (const mode of ['on', 'off']) {
    const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF, hasTouch: W < 600, isMobile: W < 600 });
    await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await c.newPage();
    await p.addInitScript(m => { try { localStorage.setItem('kws-motion', m); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} window.__draws = 0; window.__kit = []; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap; ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (x) { window.__draws++; return o.call(this, x); };
      const ra = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { return ra.call(window, f.name === 'frame' || /share|credit/.test(f.toString().slice(0, 400)) ? t => { const a = performance.now(); f(t); window.__kit.push(performance.now() - a); } : f); }; }, mode);
    await p.goto('http://localhost:8730/kit/light/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(2500);
    await p.evaluate(async () => { for (const e of document.querySelectorAll('main > section')) { e.scrollIntoView({ block: 'start', behavior: 'instant' }); await new Promise(r => setTimeout(r, 350)); } scrollTo({ top: 0, behavior: 'instant' }); });
    const s = await c.newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    pages[mode] = p;
  }
  const res = {};
  for (let pass = 0; pass < PASSES; pass++) for (const [label, sel, off] of POS) for (const mode of ['on', 'off']) {
    const p = pages[mode]; await p.bringToFront();
    await p.evaluate(([s, o]) => { const r = document.querySelector(s).getBoundingClientRect(); scrollTo({ top: scrollY + r.top - o, behavior: 'instant' }); }, [sel, off]); await p.waitForTimeout(700);
    const r = await p.evaluate(() => new Promise(res => { const f = []; let last = 0; const d0 = window.__draws; window.__kit = []; const t0 = performance.now(); const loop = t => { if (last) f.push(t - last); last = t; if (performance.now() - t0 < 3000) requestAnimationFrame(loop); else res({ f, d: window.__draws - d0, kit: window.__kit.slice() }); }; requestAnimationFrame(loop); }));
    const k = label + ' | ' + mode; (res[k] = res[k] || { f: [], d: 0, kit: [] }); res[k].f.push(...r.f); res[k].d += r.d; res[k].kit.push(...r.kit);
  }
  for (const k in res) { const s = res[k].f.slice().sort((a, b) => a - b), kt = res[k].kit.slice().sort((a, b) => a - b); console.log(`${k.padEnd(46)} frames ${String(s.length).padStart(4)}  median ${q(s, .5).toFixed(1)}  p95 ${q(s, .95).toFixed(1).padStart(5)}  worst ${s[s.length - 1].toFixed(1).padStart(6)}  over 50ms ${String(s.filter(x => x > 50).length).padStart(2)}  draws/s ${(res[k].d / (3 * PASSES)).toFixed(0).padStart(3)}${kt.length ? `  kit callback p95 ${q(kt, .95).toFixed(1)} worst ${kt[kt.length - 1].toFixed(1)}ms` : ''}`); }
  console.log('load after', os.loadavg()[0].toFixed(1));
  await b.close();
})();
