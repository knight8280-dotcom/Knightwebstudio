// Adversarial CLS: hold the kit scripts back, park the viewport on each component, release, watch shifts + geometry before/after.
const { launch, ctx, URL, PORT } = require('./common');
const CLS = () => {
  window.__cls = 0; window.__shifts = [];
  new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), src: (e.sources || []).map(s => { const n = s.node; return n ? (n.nodeName + '.' + (typeof n.className === 'string' ? n.className : '')).slice(0, 50) + ' ' + JSON.stringify([s.previousRect.y, s.currentRect.y, s.previousRect.height, s.currentRect.height]) : '?'; }) }); } }).observe({ type: 'layout-shift', buffered: true });
};
(async () => {
  const b = await launch();
  for (const [name, url, sel, opt] of [
    ['demo stack', URL, '#pricing .kws-folders', {}],
    ['demo brand phone-stack', URL, '.demo-brand .kws-folders', {}],
    ['demo marks', URL, '.kws-marks', {}],
    ['portable stack', PORT, '.kws-folders--stack', {}],
    ['portable stack, no html.js', PORT, '.kws-folders--stack', { nojsclass: true }],
  ]) for (const w of [390, 1440]) {
    const c = await ctx(b, { viewport: { width: w, height: w === 390 ? 844 : 900 } });
    const p = await c.newPage();
    let release; const gate = new Promise(r => release = r);
    await p.route(/kit\/light\/(shader|cards)\.js/, async r => { await gate; r.continue(); });
    if (opt.nojsclass) await p.route(/portable\.html/, async r => { const resp = await r.fetch(); let t = await resp.text(); t = t.replace("d.classList.add('js');", ''); r.fulfill({ response: resp, body: t }); });
    await p.addInitScript(CLS);
    await p.goto(url, { waitUntil: 'commit' }); await p.waitForSelector('.kws-folders--stack', { state: 'attached' }); await p.waitForFunction(() => document.readyState !== 'loading' || document.querySelectorAll('.kws-shader').length > 5);
    await p.waitForTimeout(700);
    await p.evaluate(s => { const e = document.querySelector(s); e.scrollIntoView({ block: 'start' }); scrollBy(0, -120); }, sel);
    await p.waitForTimeout(400);
    const geo = s => p.evaluate(s => { const e = document.querySelector(s), r = e.getBoundingClientRect(); const nx = e.nextElementSibling || e.parentElement.nextElementSibling; return { top: Math.round(r.top * 10) / 10, h: Math.round(r.height * 10) / 10, nextTop: nx ? Math.round(nx.getBoundingClientRect().top * 10) / 10 : null, docH: document.documentElement.scrollHeight, live: e.classList.contains('is-live') }; }, s);
    const before = await geo(sel);
    await p.evaluate(() => { window.__cls = 0; window.__shifts = []; });
    release();
    await p.waitForTimeout(2500);
    const after = await geo(sel);
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(5), shifts: window.__shifts.slice(0, 5) }));
    console.log(`${name} @${w}: before ${JSON.stringify(before)} after ${JSON.stringify(after)} CLS ${r.cls} ${JSON.stringify(r.shifts)}`);
    await c.close();
  }
  await b.close();
})();
