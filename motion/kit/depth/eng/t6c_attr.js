// Who forces style during the ring scroll, and how much layer memory the ring holds (by layer size).
const { chromium, DEMO, ONE, BARE, log } = require('./lib');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const [url, vw, dpr] of [[BARE, 390, 2], [ONE, 390, 2], [ONE, 390, 3], [ONE, 1440, 1], [ONE, 820, 2]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: 844 }, deviceScaleFactor: dpr, hasTouch: vw < 1000, isMobile: vw < 1000 });
    const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('LayerTree.enable'); let layers = []; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers; });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('.kws-ring-stage'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 150); }); await p.waitForTimeout(900);
    const card = await p.evaluate(() => { const c = document.querySelector('.kws-ring-card'); return [c.offsetWidth, c.offsetHeight]; });
    const mine = layers.filter(l => l.drawsContent && Math.abs(l.width - card[0]) < 3 && l.height >= card[1] - 2 && l.height < card[1] * 1.6);
    const px = mine.reduce((a, l) => a + l.width * l.height, 0);
    // ask the compositor what it really holds for one of them
    let mem = ''; try { const snap = await cdp.send('LayerTree.compositingReasons', { layerId: mine[0].layerId }); mem = (snap.compositingReasonIds || snap.compositingReasons || []).join(','); } catch (e) { mem = 'n/a'; }
    log(`${url.split('/').pop()} ${vw}px dpr ${dpr}: ring card ${card[0]}x${card[1]} css px; ${mine.length} card layers that draw (of ${layers.filter(l => l.drawsContent).length} drawing layers on the page); ${Math.round(px / 1000)}k css px = ${(px * dpr * dpr * 4 / 1048576).toFixed(1)} MB at device resolution; why layers: ${mem}`);
    await cdp.send('LayerTree.disable');
    if (url === ONE && vw === 390 && dpr === 2) {
      const events = []; cdp.on('Tracing.dataCollected', e => events.push(...e.value));
      await p.evaluate(() => { const e = document.querySelector('.kws-ring'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 700); }); await p.waitForTimeout(500);
      await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack'], excludedCategories: ['*'] } });
      for (let k = 0; k < 2; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 760, id: 1 }] }); for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 60, y: 760 - i * 12, id: 1 }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(40); }
      await p.waitForTimeout(1000);
      const done = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done;
      const who = {}; events.filter(e => (e.name === 'UpdateLayoutTree' || e.name === 'Layout') && e.ph === 'X').forEach(e => { const s = (e.args.beginData && e.args.beginData.stackTrace) || e.args.stackTrace; if (s && s[0]) { const k = e.name + ' forced by ' + (s[0].functionName || '(anonymous)') + ' ' + s[0].url.split('/').slice(-1)[0] + ':' + (s[0].lineNumber) + (s[1] ? ' < ' + (s[1].functionName || '(anon)') + ' ' + s[1].url.split('/').slice(-1)[0] + ':' + s[1].lineNumber : ''); who[k] = who[k] || { n: 0, ms: 0 }; who[k].n++; who[k].ms += e.dur / 1000; } });
      log('   style/layout work with a script stack during a scroll past the ring (one-ring page, 4x not applied):'); Object.entries(who).sort((a, b) => b[1].n - a[1].n).slice(0, 8).forEach(([k, v]) => log(`     ${v.n}x, ${v.ms.toFixed(1)}ms  ${k}`));
    }
    await ctx.close();
  }
  await b.close();
})();
