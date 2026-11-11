// Leaks: (1) remove a mounted element from the page without calling the remover: it must be collected.
//        (2) mount and unmount 200 times: listeners and nodes must not pile up.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(400);
  const cdp = await ctx.newCDPSession(p);
  const counts = async () => { await p.evaluate(() => gc()); await cdp.send('HeapProfiler.collectGarbage'); const m = await cdp.send('Performance.getMetrics').catch(() => null);
    const c = await cdp.send('Memory.getDOMCounters'); return c; };
  await cdp.send('Performance.enable');
  let bad = 0;
  for (const [name, sel] of [['arc', '#client .kws-arc'], ['spotlight', '#client .kws-spot']]) {
    // (1)
    await p.evaluate(async ([name, sel]) => { const src = document.querySelector(sel); const el = src.cloneNode(true); el.classList.remove('is-live'); el.querySelectorAll('[class*="-ctl"],output').forEach(x => x.remove());
      src.after(el); KWS[name].mount(el); el.querySelector('button:last-of-type').click();   // moving when it is removed
      window.__ref = new WeakRef(el); await new Promise(r => setTimeout(r, 80)); el.remove(); }, [name, sel]);
    await p.waitForTimeout(1200);
    let gone = false; for (let i = 0; i < 6 && !gone; i++) { await p.evaluate(() => gc()); await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(200); gone = await p.evaluate(() => window.__ref.deref() === undefined); }
    console.log(`${gone ? 'PASS' : 'FAIL'}  ${name}: an element removed from the page while mounted and moving is garbage-collected (observers, listeners and frames let go)`); if (!gone) bad++;
    // (2)
    const before = await counts();
    await p.evaluate(([name, sel]) => { const el = document.querySelector(sel); KWS[name].mount(el)(); for (let i = 0; i < 200; i++) KWS[name].mount(el)(); KWS[name].mount(el); }, [name, sel]);
    await p.waitForTimeout(300); const after = await counts();
    const ok = after.jsEventListeners - before.jsEventListeners <= 0 && after.nodes - before.nodes <= 2;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: 200 mount/unmount cycles: listeners ${before.jsEventListeners} to ${after.jsEventListeners}, nodes ${before.nodes} to ${after.nodes}`); if (!ok) bad++;
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
