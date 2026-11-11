// 5. Performance at 390x844, DPR 2, CPU 4x: a finger scrolls the last 2,600px of the pricing page to the very end.
// rAF frame gaps (main thread) AND a trace: compositor DrawFrame gaps, dropped frames, main-thread Layout / style / paint time, forced layouts (with a JS stack).
//   today (old band+footer) | kit, CSS only | kit + shader.  Pages are taken in turn, PASSES each.
const { launch, BLOCK } = require('./common');
const PASSES = +process.argv[2] || 2;
const PAGES = [['today      ', 'http://localhost:8730/pricing/', false], ['kit css    ', 'http://localhost:8730/kit/closing/test/pricing-with-kit.html', false], ['kit+shader ', 'http://localhost:8730/kit/closing/test/pricing-with-kit.html', true]];
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : 0; };
(async () => {
  const b = await launch();
  const run = async (url, shader, rate, tag) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await c.route(BLOCK, r => r.abort());
    await c.addInitScript(() => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { window.__raf++; return r.call(window, f); }; try { localStorage.setItem('kws-motion', 'on'); } catch (e) {} });
    const p = await c.newPage();
    if (!shader) await p.route('**/shader.js', r => r.abort());
    await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    const s = await c.newCDPSession(p);
    await s.send('Emulation.setCPUThrottlingRate', { rate });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight - innerHeight - 2600); });
    await p.waitForTimeout(600);
    const events = []; s.on('Tracing.dataCollected', d => events.push(...d.value));
    await s.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'disabled-by-default-devtools.timeline.stack', 'blink.user_timing', 'cc', 'benchmark'], excludedCategories: ['*'] } });
    await p.evaluate(() => { window.__t = []; window.__on = true; const loop = now => { window.__t.push(now); if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); performance.mark('scroll-start'); });
    for (let n = 0; n < 9; n++) {
      await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700, id: 1 }] });
      for (let i = 1; i <= 26; i++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 20 * i, id: 1 }] }); await p.waitForTimeout(16); }
      await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForTimeout(120);
    }
    await p.waitForTimeout(700);
    const t = await p.evaluate(() => { window.__on = false; performance.mark('scroll-end'); return window.__t; });
    const done = new Promise(r => s.once('Tracing.tracingComplete', r)); await s.send('Tracing.end'); await done;
    const left = await p.evaluate(() => Math.round(document.documentElement.scrollHeight - innerHeight - scrollY));
    const lt = await p.evaluate(() => 0);
    await c.close();
    // ---- parse ----
    const marks = events.filter(e => e.cat && e.cat.includes('blink.user_timing') && /scroll-(start|end)/.test(e.name));
    const t0 = (marks.find(m => m.name === 'scroll-start') || {}).ts || 0, t1 = (marks.find(m => m.name === 'scroll-end') || {}).ts || Infinity;
    const inWin = e => e.ts >= t0 && e.ts <= t1;
    const draw = events.filter(e => e.name === 'DrawFrame' && inWin(e)).map(e => e.ts).sort((a, b) => a - b);
    const dgap = draw.slice(1).map((x, i) => (x - draw[i]) / 1000);
    const dropped = events.filter(e => e.name === 'DroppedFrame' && inWin(e)).length;
    const dur = n => events.filter(e => e.name === n && e.ph === 'X' && inWin(e));
    const sum = a => a.reduce((x, e) => x + (e.dur || 0), 0) / 1000;
    const layouts = dur('Layout'), styles = dur('UpdateLayoutTree'), paints = dur('Paint'), pre = dur('PrePaint'), layerize = dur('Layerize'), commit = dur('Commit'), fn = dur('FunctionCall'), raster = dur('RasterTask');
    const forced = layouts.filter(e => e.args && e.args.beginData && e.args.beginData.stackTrace && e.args.beginData.stackTrace.length);
    const forcedBy = {}; forced.forEach(e => { const f = e.args.beginData.stackTrace[0]; const k = (f.url || '').split('/').pop() + ':' + f.lineNumber + ' ' + (f.functionName || ''); forcedBy[k] = (forcedBy[k] || 0) + 1; });
    const long = events.filter(e => (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') && e.ph === 'X' && inWin(e) && e.dur > 50000).length;
    return { d: t.slice(1).map((x, i) => x - t[i]), dgap, dropped, left, layoutN: layouts.length, layoutMs: sum(layouts), styleN: styles.length, styleMs: sum(styles), paintN: paints.length, paintMs: sum(paints), preMs: sum(pre), layerizeMs: sum(layerize), commitMs: sum(commit), jsMs: sum(fn), rasterN: raster.length, rasterMs: sum(raster), forced: forced.length, forcedBy, long, secs: (t1 - t0) / 1e6 };
  };
  await run(PAGES[1][1], true, 1, 'warm');
  for (const rate of [4, 1]) {
    const all = PAGES.map(() => ({ d: [], dgap: [], rows: [] }));
    for (let k = 0; k < PASSES; k++) for (let i = 0; i < PAGES.length; i++) { const r = await run(PAGES[i][1], PAGES[i][2], rate, PAGES[i][0].trim() + k); all[i].d.push(...r.d); all[i].dgap.push(...r.dgap); all[i].rows.push(r); }
    all.forEach((a, i) => {
      const R = a.rows, avg = k => (R.reduce((x, r) => x + r[k], 0) / R.length);
      const fb = {}; R.forEach(r => Object.entries(r.forcedBy).forEach(([k, v]) => { fb[k] = (fb[k] || 0) + v; }));
      console.log(`${rate}x ${PAGES[i][0]} rAF: ${a.d.length} frames, median ${pct(a.d, .5).toFixed(1)}ms, p95 ${pct(a.d, .95).toFixed(1)}, p99 ${pct(a.d, .99).toFixed(1)}, worst ${Math.max(...a.d).toFixed(0)}, >34ms ${a.d.filter(x => x > 34).length} (${(a.d.filter(x => x > 34).length / a.d.length * 100).toFixed(2)}%)` +
        ` | compositor DrawFrame: ${a.dgap.length} gaps, median ${pct(a.dgap, .5).toFixed(1)}ms, p95 ${pct(a.dgap, .95).toFixed(1)}, p99 ${pct(a.dgap, .99).toFixed(1)}, worst ${a.dgap.length ? Math.max(...a.dgap).toFixed(0) : '-'}, >34ms ${a.dgap.filter(x => x > 34).length}; dropped-frame events ${avg('dropped').toFixed(0)}/pass` +
        `\n      main thread per pass (${avg('secs').toFixed(1)}s): Layout ${avg('layoutN').toFixed(0)}x ${avg('layoutMs').toFixed(1)}ms (forced, with a JS stack: ${avg('forced').toFixed(1)}${Object.keys(fb).length ? ' ' + JSON.stringify(fb) : ''}), style ${avg('styleN').toFixed(0)}x ${avg('styleMs').toFixed(1)}ms, PrePaint ${avg('preMs').toFixed(1)}ms, Paint ${avg('paintN').toFixed(0)}x ${avg('paintMs').toFixed(1)}ms, Layerize ${avg('layerizeMs').toFixed(1)}ms, Commit ${avg('commitMs').toFixed(1)}ms, JS ${avg('jsMs').toFixed(1)}ms, raster tasks ${avg('rasterN').toFixed(0)}x ${avg('rasterMs').toFixed(0)}ms, tasks >50ms ${avg('long').toFixed(1)}; reached the end: ${R.every(r => r.left === 0)}`);
    });
  }
  await b.close();
})();
