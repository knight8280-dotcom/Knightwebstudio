// Mount and remove both components ten times on the bare page: heap after GC, window listeners, DOM nodes, observers still firing.
const { chromium, BARE, log, ok, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const p = await open(b, BARE, { w: 1280, h: 900 });
  const cdp = await p.ctx.newCDPSession(p);
  const stat = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); const h = await cdp.send('Runtime.getHeapUsage'); const c = await cdp.send('Memory.getDOMCounters'); const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' }); const l = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId }); return { heapKB: Math.round(h.usedSize / 1024), nodes: c.nodes, jsListeners: c.jsEventListeners, windowScroll: l.listeners.filter(x => x.type === 'scroll').length }; };
  // start from an unmounted page
  await p.evaluate(() => { window.__offs = [KWS.cylinder.mount(document.querySelector('.kws-cyl')), KWS.ring.mount(document.querySelector('.kws-ring'))]; window.__offs.forEach(f => f()); });
  const s0 = await stat();
  await p.evaluate(async () => { const c = document.querySelector('.kws-cyl'), r = document.querySelector('.kws-ring'); for (let i = 0; i < 10; i++) { const a = KWS.cylinder.mount(c), b = KWS.ring.mount(r); c.querySelector('.kws-cyl-nav:last-child').click(); scrollBy(0, 40); await new Promise(x => setTimeout(x, 120)); a(); b(); } scrollTo(0, 0); });
  await p.waitForTimeout(500);
  const s1 = await stat();
  ok(s1.nodes <= s0.nodes + 2 && s1.jsListeners <= s0.jsListeners && s1.windowScroll === s0.windowScroll && s1.heapKB - s0.heapKB < 200, 'ten mount/remove cycles of both components: nothing accumulates', `before ${JSON.stringify(s0)} after ${JSON.stringify(s1)}`);
  // ten made, used and then simply removed from the page without calling the remover
  await p.evaluate(async () => { const c = document.querySelector('.kws-cyl'), r = document.querySelector('.kws-ring'); for (let i = 0; i < 10; i++) { const c2 = c.cloneNode(true), r2 = r.cloneNode(true); document.body.append(c2, r2); KWS.cylinder.mount(c2); KWS.ring.mount(r2); await new Promise(x => setTimeout(x, 80)); c2.remove(); r2.remove(); } scrollBy(0, 5); await new Promise(x => setTimeout(x, 300)); scrollTo(0, 0); });
  await p.waitForTimeout(600);
  const s2 = await stat();
  ok(s2.nodes <= s0.nodes + 2 && s2.windowScroll === s0.windowScroll && s2.heapKB - s0.heapKB < 300, 'ten made and simply removed from the page (no remover called): cleaned up after the next scroll', `after ${JSON.stringify(s2)}`);
  ok(p.errs.length === 0, 'no errors', p.errs.join('|'));
  await p.ctx.close(); await b.close();
})();
