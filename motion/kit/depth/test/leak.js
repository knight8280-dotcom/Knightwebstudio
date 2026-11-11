// Leaks: 20 cylinders and 20 rings are made, used, and taken off the page (half with the remover, half just removed
// from the DOM). After a forced garbage collection none of them may still be alive, and the window may hold no
// more scroll listeners than before.   node test/leak.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8730/kit/depth/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(p);
  const scrollListeners = async () => { const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' }); const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId }); return listeners.filter(l => l.type === 'scroll').length; };
  const before = await scrollListeners();
  await p.evaluate(async () => {
    // pristine markup: take the first of each off the page's live state, copy, put it back
    const c0 = document.querySelector('#how .kws-cyl'), r0 = document.querySelector('#included .kws-ring');
    KWS.cylinder.mount(c0)(); KWS.ring.mount(r0)(); const cHTML = c0.outerHTML, rHTML = r0.outerHTML; KWS.cylinder.mount(c0); KWS.ring.mount(r0);
    window.__refs = []; const host = document.createElement('div'); document.querySelector('main').prepend(host);
    for (let i = 0; i < 20; i++) {
      host.insertAdjacentHTML('beforeend', cHTML + rHTML);
      const c = host.children[host.children.length - 2], r = host.lastElementChild;
      const offC = KWS.cylinder.mount(c), offR = KWS.ring.mount(r);
      c.querySelector('.kws-cyl-nav:last-child').click();
      window.__refs.push(new WeakRef(c), new WeakRef(r));
      await new Promise(d => setTimeout(d, 60)); window.scrollBy(0, 40);
      if (i % 2) { offC(); offR(); }
    }
    await new Promise(d => setTimeout(d, 400));
    host.remove(); window.scrollBy(0, 10);   // the half that was never told: just gone from the page
    await new Promise(d => setTimeout(d, 400));
  });
  for (let i = 0; i < 4; i++) { await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(250); }
  const alive = await p.evaluate(() => window.__refs.filter(r => r.deref()).length);
  const after = await scrollListeners();
  console.log(`${alive === 0 ? 'PASS' : 'FAIL'}  40 components made and removed: ${alive} still alive after garbage collection`);
  console.log(`${after <= before ? 'PASS' : 'FAIL'}  scroll listeners on the window: ${before} before, ${after} after`);
  console.log(`${errs.length ? 'FAIL' : 'PASS'}  no errors${errs.length ? ': ' + errs.join(' | ') : ''}`);
  await b.close(); process.exit(alive || after > before || errs.length ? 1 : 0);
})();
