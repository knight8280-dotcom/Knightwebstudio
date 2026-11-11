// Frame times at 390x844@3x with 4x CPU throttle; kit callback cost; forced layout inside the frame loop via a trace.
const { launch, ctx, URL } = require('./common');
const fs = require('fs');
const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), DSF = +(process.argv[4] || 3), THR = +(process.argv[5] || 4);
const INS = () => {
  window.__k = []; window.__kraf = 0; const r = window.requestAnimationFrame;
  window.requestAnimationFrame = function (f) {
    if (/shader\.js/.test(new Error().stack)) { window.__kraf++; return r.call(window, function (t) { const a = performance.now(); f(t); window.__k.push(performance.now() - a); }); }
    return r.call(window, f);
  };
  window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap;
  ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); };
  window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
};
const stats = a => { if (!a.length) return 'n=0'; const s = a.slice().sort((x, y) => x - y), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return `n=${a.length} median ${q(.5).toFixed(1)} p95 ${q(.95).toFixed(1)} worst ${s[s.length - 1].toFixed(1)} >33.4ms:${a.filter(x => x > 33.4).length} >50ms:${a.filter(x => x > 50).length}`; };
(async () => {
  const b = await launch();
  const c = await ctx(b, { viewport: { width: W, height: H }, deviceScaleFactor: DSF, hasTouch: W < 600, isMobile: W < 600 });
  const p = await c.newPage(); await p.addInitScript(INS);
  const s = await c.newCDPSession(p);
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  await s.send('Emulation.setCPUThrottlingRate', { rate: THR });
  console.log(`viewport ${W}x${H}@${DSF}x, CPU throttle ${THR}x`);
  const measure = async (label, ms, during) => {
    await p.evaluate(() => { window.__k = []; window.__lt = []; window.__f = []; window.__d0 = window.__draws; let last = 0; window.__stop = false; const loop = t => { if (last) window.__f.push(t - last); last = t; if (!window.__stop) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    if (during) await during(); else await p.waitForTimeout(ms);
    const r = await p.evaluate(() => { window.__stop = true; return { f: window.__f, k: window.__k, lt: window.__lt, d: window.__draws - window.__d0 }; });
    const secs = r.f.reduce((a, x) => a + x, 0) / 1000;
    console.log(`${label}\n   page frame interval: ${stats(r.f)}\n   kit callback: ${stats(r.k)}  draws/s ${(r.d / secs).toFixed(1)}  long tasks(>50ms): ${r.lt.length ? r.lt.join(',') : 'none'}`);
  };
  for (const [label, sel, block] of [['first screen (wash)', '#top', 'start'], ['three bookmark cards (3 ribbons)', '#services .kws-marks', 'center'], ['step folders (1 ribbon)', '#process .kws-folders', 'start'], ['package stack (no canvas)', '#pricing .kws-folders', 'start'], ['second brand (wash + ribbons)', '.demo-brand', 'start'], ['closing band', '.cta-band', 'center']]) {
    await p.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ block: b, behavior: 'instant' }), [sel, block]); await p.waitForTimeout(1200);
    for (let pass = 0; pass < 2; pass++) await measure(`${label} pass ${pass + 1}`, 4000);
  }
  // tab switching, rapid, under throttle
  await p.evaluate(() => document.querySelector('#pricing .kws-folders').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(800);
  await measure('switching tabs every 350ms (animation .28s)', 0, async () => { for (let i = 0; i < 12; i++) { await p.evaluate(i => document.querySelectorAll('#pricing [role=tab]')[i % 4].click(), i + 1); await p.waitForTimeout(350); } });
  // scrolling the whole page with wheel-less programmatic steps (touch scroll emulation is separate)
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
  await measure('scrolling top to bottom, 40px per frame', 0, async () => { await p.evaluate(() => new Promise(res => { const step = () => { scrollBy(0, 40); if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) res(); else requestAnimationFrame(step); }; requestAnimationFrame(step); })); });
  // Trace: forced layout inside the kit's frames
  for (const [label, sel] of [['cards', '#services .kws-marks'], ['band', '.cta-band'], ['wash', '#top']]) {
    await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await p.waitForTimeout(1200);
    const events = [];
    s.on('Tracing.dataCollected', d => events.push(...d.value));
    await s.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.user_timing'] } });
    await p.waitForTimeout(3000);
    const done = new Promise(r => s.once('Tracing.tracingComplete', r));
    await s.send('Tracing.end'); await done;
    s.removeAllListeners('Tracing.dataCollected');
    // find FireAnimationFrame / FunctionCall events and nested Layout / UpdateLayoutTree
    const main = events.filter(e => e.ph === 'X');
    const fa = main.filter(e => e.name === 'FireAnimationFrame');
    const inside = (e, parents) => parents.some(f => f.tid === e.tid && e.ts >= f.ts && e.ts + (e.dur || 0) <= f.ts + f.dur);
    const lay = main.filter(e => e.name === 'Layout'), sty = main.filter(e => e.name === 'UpdateLayoutTree' || e.name === 'RecalculateStyles');
    const layIn = lay.filter(e => inside(e, fa)), styIn = sty.filter(e => inside(e, fa));
    const fd = fa.map(e => e.dur / 1000);
    console.log(`trace ${label}: FireAnimationFrame ${stats(fd)} | Layout events total ${lay.length}, inside rAF ${layIn.length} | style recalcs total ${sty.length}, inside rAF ${styIn.length}`);
    fs.writeFileSync(`trace-${label}-${W}.json`, JSON.stringify(events.filter(e => /Layout|UpdateLayoutTree|FireAnimationFrame|FunctionCall|Paint|Composite|RasterTask|GPUTask/.test(e.name)).slice(0, 20000)));
  }
  await s.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await b.close();
})();
