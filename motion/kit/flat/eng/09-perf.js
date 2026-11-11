// Frame times at 390x844 @2x with CPU throttled 4x (and 6x for headroom), plus a devtools trace: layouts / forced reflows / paints in the frame loop.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const fs = require('fs');
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const rate of [4, 6]) for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spot', '#work .kws-spot', '.kws-spot-frame']]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const cdp = await ctx.newCDPSession(p); await scrollToSel(p, sel, 180); await p.waitForTimeout(400);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const rec = () => p.evaluate(s => new Promise(done => { const el = document.querySelector(s), t = []; let seen = false, quiet = 0;
      const loop = now => { const m = el.classList.contains('is-moving'); if (m) { seen = true; t.push(now); quiet = 0; } else if (seen && ++quiet > 3) return done(t); else if (!seen && ++quiet > 300) return done(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
    const stats = t => { const d = t.slice(1).map((x, i) => x - t[i]); if (!d.length) return 'no frames'; return `${d.length} frames  median ${pct(d, .5).toFixed(1)}ms  p95 ${pct(d, .95).toFixed(1)}ms  worst ${Math.max(...d).toFixed(1)}ms  >20ms: ${d.filter(x => x > 20).length}  >33.4ms: ${d.filter(x => x > 33.4).length}  first3: ${d.slice(0, 3).map(x => x.toFixed(0)).join('/')}`; };
    const runs = { next: [], drag: [] };
    for (let k = 0; k < 4; k++) {
      let r = rec(); await p.waitForTimeout(80); await p.evaluate(s => document.querySelector(s + ' button[aria-label^="Next"]').click(), sel); let t = await r; runs.next.push(t); await p.waitForTimeout(250);
      const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 30;
      r = rec(); await p.waitForTimeout(80);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 150 * Math.sin(i / 45 * Math.PI * 1.5), y: y + 2, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); t = await r; runs.drag.push(t); await p.waitForTimeout(300);
    }
    for (const k of ['next', 'drag']) { const all = runs[k].flatMap(t => t.slice(1).map((x, i) => x - t[i])); console.log(`${rate}x ${name} ${k}: ` + runs[k].map(stats).join('\n            ')); console.log(`      pooled: ${all.length} frames median ${pct(all, .5).toFixed(1)} p95 ${pct(all, .95).toFixed(1)} p99 ${pct(all, .99).toFixed(1)} worst ${Math.max(...all).toFixed(1)}  >33.4: ${all.filter(x => x > 33.4).length}`); }
    // Trace one Next and one drag at this throttle
    if (rate === 4) {
      const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value));
      await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'blink.user_timing'] } });
      await p.evaluate(() => performance.mark('eng-start'));
      await p.evaluate(s => document.querySelector(s + ' button[aria-label^="Next"]').click(), sel); await settle(p, sel); await p.waitForTimeout(100);
      const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 30;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 150 * Math.sin(i / 45 * Math.PI * 1.5), y: y + 2, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(p, sel); await p.waitForTimeout(100);
      await p.evaluate(() => performance.mark('eng-end'));
      const done = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done;
      const t0 = (events.find(e => e.name === 'eng-start') || {}).ts, t1 = (events.find(e => e.name === 'eng-end') || {}).ts;
      const inWin = events.filter(e => e.ts >= t0 && e.ts <= t1 && e.ph === 'X');
      const sum = n => { const ev = inWin.filter(e => e.name === n); return { count: ev.length, totalMs: +(ev.reduce((a, e) => a + (e.dur || 0), 0) / 1000).toFixed(1), maxMs: +(Math.max(0, ...ev.map(e => e.dur || 0)) / 1000).toFixed(2) }; };
      const layouts = inWin.filter(e => e.name === 'Layout'); const forced = layouts.filter(e => e.args && e.args.beginData && e.args.beginData.stackTrace && e.args.beginData.stackTrace.length);
      const raf = inWin.filter(e => e.name === 'FireAnimationFrame'); const rafWithLayout = raf.filter(f => layouts.some(l => l.ts >= f.ts && l.ts <= f.ts + f.dur));
      const recalcForced = inWin.filter(e => e.name === 'UpdateLayoutTree' && raf.some(f => e.ts >= f.ts && e.ts <= f.ts + f.dur));
      console.log(`   trace ${name} (4x): FireAnimationFrame ${JSON.stringify(sum('FireAnimationFrame'))}  Layout ${JSON.stringify(sum('Layout'))}  forced(with JS stack) ${forced.length}  rAF callbacks containing a Layout: ${rafWithLayout.length}  style recalcs forced inside rAF: ${recalcForced.length}  UpdateLayoutTree ${JSON.stringify(sum('UpdateLayoutTree'))}  Paint ${JSON.stringify(sum('Paint'))}  PrePaint ${JSON.stringify(sum('PrePaint'))} Layerize ${JSON.stringify(sum('Layerize'))} EventDispatch ${JSON.stringify(sum('EventDispatch'))}`);
      if (forced.length) console.log('   forced layout stacks:', JSON.stringify(forced.slice(0, 3).map(f => f.args.beginData.stackTrace.slice(0, 2))));
      fs.writeFileSync(`trace-${name}-summary.json`, JSON.stringify({ layouts: layouts.length, forced: forced.length, raf: raf.length }));
    }
    await ctx.close();
  }
  await b.close();
})();
