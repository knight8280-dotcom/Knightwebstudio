// 5b. A trace while the ring turns (scroll past, then drag + coast) and while the cylinder turns: forced layouts, layout/style per frame, long tasks; layer counts and layer memory.
const { chromium, DEMO, ONE, log } = require('./lib');
const url = process.argv[2] || ONE;
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(p);
  // ---- layers
  await cdp.send('LayerTree.enable'); let layers = [];
  cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers; });
  const layerStat = async label => { await p.waitForTimeout(500); const big = layers.filter(l => l.drawsContent); const px = big.reduce((a, l) => a + l.width * l.height, 0); log(`layers ${label}: ${layers.length} in the tree, ${big.length} that draw; drawn area ${Math.round(px / 1000)}k css px (about ${(px * 4 * 4 / 1048576).toFixed(1)} MB of tiles at 2x density if rastered at layout size)`); return { n: big.length, px }; };
  await p.evaluate(() => scrollTo(0, 0)); const l0 = await layerStat('ring off screen (top of page)');
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('.kws-ring-stage'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 150); }); const l1 = await layerStat('ring on screen, at rest');
  const dims = await p.evaluate(() => { const c = document.querySelector('.kws-ring-card'); return { w: c.offsetWidth, h: c.offsetHeight, n: document.querySelectorAll('.kws-ring-stage')[0].querySelectorAll('.kws-ring-card').length, wc: getComputedStyle(c).willChange, bf: getComputedStyle(c).backfaceVisibility }; });
  log(`   ring card layout box ${dims.w}x${dims.h} css px, ${dims.n} cards; will-change: ${dims.wc}`);
  await cdp.send('LayerTree.disable');
  // ---- trace
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value));
  const run = async (label, action) => {
    events.length = 0;
    await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'v8.execute'], excludedCategories: ['*'] } });
    await action();
    const done = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done;
    const main = events.filter(e => e.name === 'RunTask' && e.ph === 'X'); const byTid = {}; main.forEach(e => byTid[e.pid + ':' + e.tid] = (byTid[e.pid + ':' + e.tid] || 0) + e.dur); const tid = Object.entries(byTid).sort((a, b) => b[1] - a[1])[0][0];
    const on = e => (e.pid + ':' + e.tid) === tid;
    const X = n => events.filter(e => on(e) && e.name === n && e.ph === 'X');
    const lay = X('Layout'), ulT = X('UpdateLayoutTree'), raf = X('FireAnimationFrame'), commit = X('Commit'), layerize = X('Layerize'), paint = X('Paint'), pre = X('PrePaint');
    const inside = (e, outer) => outer.some(o => e.ts >= o.ts && e.ts + e.dur <= o.ts + o.dur);
    const fn = X('FunctionCall').concat(X('EventDispatch'), raf);
    const forcedLayout = lay.filter(e => inside(e, fn)), forcedStyle = ulT.filter(e => inside(e, fn));
    const sum = a => a.reduce((s, e) => s + e.dur, 0) / 1000;
    const tasks = main.filter(on); const long = tasks.filter(e => e.dur > 50000).length, over16 = tasks.filter(e => e.dur > 16700).length;
    log(`\n${label}: ${raf.length} animation-frame callbacks, ${commit.length} commits`);
    log(`   layouts ${lay.length} (${sum(lay).toFixed(0)}ms), of which forced from script: ${forcedLayout.length} (${sum(forcedLayout).toFixed(1)}ms); style recalcs ${ulT.length} (${sum(ulT).toFixed(0)}ms), forced from script: ${forcedStyle.length} (${sum(forcedStyle).toFixed(1)}ms)`);
    log(`   per commit: style ${(sum(ulT) / commit.length).toFixed(2)}ms, layout ${(sum(lay) / commit.length).toFixed(2)}ms, pre-paint ${(sum(pre) / commit.length).toFixed(2)}ms, paint ${(sum(paint) / commit.length).toFixed(2)}ms, layerize ${(sum(layerize) / commit.length).toFixed(2)}ms, commit ${(sum(commit) / commit.length).toFixed(2)}ms; main-thread tasks over 16.7ms: ${over16}, over 50ms: ${long}; longest ${(Math.max(...tasks.map(e => e.dur)) / 1000).toFixed(1)}ms`);
    forcedLayout.slice(0, 4).forEach(e => { const s = e.args && e.args.beginData && e.args.beginData.stackTrace; log(`   forced layout ${(e.dur / 1000).toFixed(2)}ms from ${s && s[0] ? s[0].functionName + ' ' + s[0].url.split('/').pop() + ':' + s[0].lineNumber : '?'}`); });
    // what gets painted? count Paint events by layer / clip
    const pl = X('PaintImage').length; const upd = X('UpdateLayer').length; const rs = events.filter(e => e.name === 'RasterTask' && e.ph === 'X'); log(`   paint events ${paint.length}; raster tasks (all threads) ${rs.length}, ${(rs.reduce((s, e) => s + e.dur, 0) / 1000).toFixed(0)}ms`);
  };
  const go = (sel, off) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);
  await go('.kws-ring', -700); await p.waitForTimeout(600);
  await run('RING scroll past, 4x', async () => { for (let k = 0; k < 2; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 760, id: 1 }] }); for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 60, y: 760 - i * 12, id: 1 }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(40); } await p.waitForTimeout(1200); });
  await go('.kws-ring', -150); await p.waitForTimeout(900);
  const sb = await p.locator('.kws-ring-stage').first().boundingBox(); const sx = sb.x + sb.width / 2, sy = sb.y + sb.height / 2;
  await run('RING drag + coast, 4x', async () => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 1 }] }); for (let i = 1; i <= 50; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx - 140 * Math.sin(i / 50 * Math.PI * 1.5), y: sy + 2, id: 1 }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(2000); });
  if (await p.$('.kws-cyl')) {
    await go('.kws-cyl', -90); await p.waitForTimeout(600);
    const box = await p.locator('.kws-cyl-card.is-on').first().boundingBox(); const x = box.x + box.width / 2, y = box.y + 200;
    await run('CYLINDER Next x2 then touch drag, 4x', async () => { await p.evaluate(() => document.querySelector('.kws-cyl-nav:last-child').click()); await p.waitForTimeout(900); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); for (let i = 1; i <= 50; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 150 * Math.sin(i / 50 * Math.PI * 1.5), y: y + 2, id: 1 }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(1200); });
  }
  await b.close();
})();
