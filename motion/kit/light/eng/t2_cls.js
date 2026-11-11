const { launch, ctx, URL, PORT } = require('./common');
const CLS = () => {
  window.__cls = 0; window.__shifts = [];
  new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), src: (e.sources || []).map(s => { const n = s.node; return n ? (n.nodeName + '.' + (n.className && n.className.baseVal === undefined ? n.className : '')).slice(0, 60) : '?'; }) }); } }).observe({ type: 'layout-shift', buffered: true });
};
(async () => {
  const b = await launch();
  const cases = [
    ['demo normal', URL, {}],
    ['portable normal', PORT, {}],
    ['demo scripts delayed 1500ms', URL, { delay: 1500 }],
    ['portable scripts delayed 1500ms', PORT, { delay: 1500 }],
    ['portable without html.js (client forgot)', PORT, { nojsclass: true }],
    ['demo cards.js blocked', URL, { blockCards: true }],
  ];
  for (const [name, url, o] of cases) for (const w of [390, 1440]) {
    const c = await ctx(b, { viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: w === 390 ? 2 : 1 });
    const p = await c.newPage();
    const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PE ' + e.message));
    if (o.delay) await p.route(/kit\/light\/(shader|cards)\.js/, async r => { await new Promise(s => setTimeout(s, o.delay)); r.continue(); });
    if (o.blockCards) await p.route(/kit\/light\/cards\.js/, r => r.abort());
    if (o.nojsclass) await p.route(/portable\.html/, async r => { const resp = await r.fetch(); let t = await resp.text(); t = t.replace("d.classList.add('js');", ''); r.fulfill({ response: resp, body: t }); });
    await p.addInitScript(CLS);
    await p.goto(url, { waitUntil: 'load' });
    await p.waitForTimeout(1800 + (o.delay || 0));
    // scroll whole page slowly
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(140); }
    await p.waitForTimeout(3000); // crosses the 4s html.js removal timeout
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(5), shifts: window.__shifts.slice(0, 6), js: document.documentElement.classList.contains('js'), ready: !!window.kwsReady,
      hidden: [...document.querySelectorAll('.kws-folders--stack > .kws-folder')].filter(f => getComputedStyle(f).visibility === 'hidden').length, live: [...document.querySelectorAll('.kws-folders--stack')].map(e => e.classList.contains('is-live')) }));
    console.log(`${name} @${w}:`, JSON.stringify(r), errs.length ? 'ERRS ' + errs.join(' | ') : '');
    await c.close();
  }
  await b.close();
})();
