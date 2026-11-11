const { chromium, URL, state, settle, scrollToSel } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
  const met = async () => { await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(100); const m = (await cdp.send('Performance.getMetrics')).metrics; const g = n => m.find(x => x.name === n).value; return { nodes: g('Nodes'), listeners: g('JSEventListeners'), heapKB: Math.round(g('JSHeapUsedSize') / 1024) }; };
  const m0 = await met();
  await p.evaluate(async () => { const a = document.querySelector('#services .kws-arc'), s = document.querySelector('#work .kws-spot'); for (let i = 0; i < 300; i++) { KWS.arc.mount(a)(); KWS.spotlight.mount(s)(); if (i % 50 === 0) await new Promise(r => setTimeout(r, 30)); } KWS.arc.mount(a); KWS.spotlight.mount(s); await new Promise(r => setTimeout(r, 200)); });
  const m1 = await met();
  // mount + remove from the DOM 10 times without calling the remover (the "element is removed" case), mid-animation
  await p.evaluate(async () => { const src = document.querySelector('.demo-client .kws-arc'); KWS.arc.mount(src)(); for (let i = 0; i < 10; i++) { const c = src.cloneNode(true); document.querySelector('main').append(c); KWS.arc.mount(c); c.querySelector('button[aria-label^="Next"]').click(); await new Promise(r => setTimeout(r, 60)); c.remove(); } KWS.arc.mount(src); await new Promise(r => setTimeout(r, 1500)); });
  const m2 = await met();
  console.log('before', JSON.stringify(m0), '\nafter 300 mount/unmount cycles (both)', JSON.stringify(m1), '\nafter 10x mount + remove-from-DOM mid-move without calling the remover', JSON.stringify(m2));
  // print
  await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(200);
  const pr = await p.evaluate(() => ['#services .kws-arc', '#work .kws-spot'].map(s => { const el = document.querySelector(s); const lis = [...el.querySelectorAll('li')]; const caps = lis.map(li => { let op = 1; const c = li.querySelector('[class$=-cap]'); op = parseFloat(getComputedStyle(c).opacity); return op; }); return { visibleCaptions: caps.filter(o => o > 0.5).length, of: lis.length, controlsShown: getComputedStyle(el.querySelector('[role=group]')).display !== 'none' }; }));
  console.log('print media:', JSON.stringify(pr)); await scrollToSel(p, '#services .kws-arc', 40); await p.screenshot({ path: 'print-arc.png' });
  await b.close();
})();
