// Scroll the whole page at 390px with 4x CPU throttle: long frames and what causes them (trace of the main thread).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const BASE = (process.argv.find(a => a.startsWith('--base=')) || '--base=http://localhost:8720').slice(7);
const PAGES = (process.argv.find(a => a.startsWith('--pages=')) || '--pages=/,/consulting/').slice(8).split(',');
(async () => {
  const browser = await chromium.launch({ channel: 'chromium' });
  for (const p of PAGES) for (const theme of ['light']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await page.goto(BASE + p, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(() => { window.__f = []; window.__loaf = []; let last = performance.now(); const tick = t => { window.__f.push([Math.round(t), +(t - last).toFixed(1), Math.round(scrollY)]); last = t; window.__raf = requestAnimationFrame(tick); }; window.__raf = requestAnimationFrame(tick);
      try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), block: Math.round(e.blockingDuration), render: Math.round(e.startTime + e.duration - e.renderStart), style: Math.round(e.startTime + e.duration - e.styleAndLayoutStart), sy: Math.round(scrollY), scripts: e.scripts.map(s => ({ inv: s.invoker.slice(0, 60), d: Math.round(s.duration), forced: Math.round(s.forcedStyleAndLayoutDuration), src: s.sourceURL.split('/').pop() + ':' + s.sourceFunctionName })) }); }).observe({ type: 'long-animation-frame', buffered: false }); } catch (e) { window.__loaf.push({ err: String(e) }); } });
    const events = []; cdp.on('Tracing.dataCollected', d => events.push(...d.value));
    await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'blink.user_timing'] } });
    const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const t0 = Date.now();
    // finger flicks: 700px per gesture at 1400 px/s, like a reader skimming
    for (let y = 0; y < H; y += 700) { await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 500, yDistance: -700, speed: 1400, gestureSourceType: 'mouse' }); await page.waitForTimeout(120); }
    const dur = Date.now() - t0;
    const done = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done;
    const r = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return { f: window.__f, loaf: window.__loaf, y: Math.round(scrollY) }; });
    // main thread = thread with the most RunTask time in the renderer
    const byThread = {}; for (const e of events) if (e.name === 'RunTask' && e.ph === 'X') { const k = e.pid + ':' + e.tid; byThread[k] = (byThread[k] || 0) + e.dur; }
    const main = Object.entries(byThread).sort((a, b) => b[1] - a[1])[0][0];
    const mine = events.filter(e => (e.pid + ':' + e.tid) === main && e.ph === 'X');
    const tasks = mine.filter(e => e.name === 'RunTask').map(e => ({ ts: e.ts, dur: e.dur / 1000 }));
    const long = tasks.filter(t => t.dur >= 50).sort((a, b) => b.dur - a.dur);
    const agg = {}; for (const e of mine) if (['Layout', 'UpdateLayoutTree', 'Paint', 'PrePaint', 'Layerize', 'Commit', 'FunctionCall', 'EvaluateScript', 'TimerFire', 'FireAnimationFrame', 'EventDispatch', 'IntersectionObserverController::computeIntersections', 'HitTest', 'ParseHTML', 'Decode Image', 'RasterTask', 'UpdateLayer', 'CompositeLayers', 'ScheduleStyleRecalculation', 'MinorGC', 'MajorGC', 'V8.GC_SCAVENGER'].includes(e.name)) agg[e.name] = (agg[e.name] || 0) + e.dur / 1000;
    const within = (t, names) => mine.filter(e => names.includes(e.name) && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur * 1000 + 1).reduce((s, e) => s + e.dur / 1000, 0);
    const frames = r.f.slice(5); const over = n => frames.filter(f => f[1] > n).length;
    const total = tasks.reduce((s, t) => s + t.dur, 0);
    console.log(`\n${BASE.slice(-4)} ${p}  scrolled ${r.y}px in ${dur}ms | rAF frames ${frames.length}: >33ms ${over(33)}, >50ms ${over(50)}, >100ms ${over(100)}, worst ${Math.max(...frames.map(f => f[1]))}ms | main-thread busy ${Math.round(total)}ms (${Math.round(100 * total / dur)}%) | tasks >=50ms: ${long.length}, worst ${long[0] ? Math.round(long[0].dur) : 0}ms`);
    console.log('   time by kind (ms): ' + Object.entries(agg).sort((a, b) => b[1] - a[1]).map(([k, v]) => k.replace('IntersectionObserverController::', 'IO::') + ' ' + Math.round(v)).join(', '));
    for (const t of long.slice(0, 5)) console.log(`   long task ${Math.round(t.dur)}ms: style ${Math.round(within(t, ['UpdateLayoutTree']))} layout ${Math.round(within(t, ['Layout']))} prepaint ${Math.round(within(t, ['PrePaint']))} paint ${Math.round(within(t, ['Paint']))} layerize ${Math.round(within(t, ['Layerize']))} commit ${Math.round(within(t, ['Commit']))} script ${Math.round(within(t, ['FunctionCall', 'EvaluateScript', 'TimerFire', 'EventDispatch']))} `);
    const lo = r.loaf.filter(l => !l.err).sort((a, b) => b.d - a.d);
    console.log(`   long animation frames (>50ms): ${lo.length}` + lo.slice(0, 5).map(l => `\n     ${l.d}ms at scrollY ${l.sy}: render ${l.render} (style+layout ${l.style}) scripts ${JSON.stringify(l.scripts)}`).join(''));
    fs.writeFileSync(`${__dirname}/scroll-${BASE.slice(-4)}-${p.replace(/\W/g, '') || 'home'}.json`, JSON.stringify({ frames: r.f, loaf: r.loaf, agg, long }, null, 0));
    await ctx.close();
  }
  await browser.close();
})();
