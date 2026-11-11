// 1. Script off, and layout shift on upgrade (incl. reduced motion and data-motion=off set before paint).
const { chromium, DEMO, BARE, log, ok, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  // ---- script off
  for (const w of [360, 390, 820, 1440]) {
    const p = await open(b, DEMO, { w, h: 900, js: false });
    const r = await p.evaluate(() => {
      const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0 && r.width > 0 && r.height > 0; };
      const cards = [...document.querySelectorAll('.kws-cyl-card')], lis = [...document.querySelectorAll('.kws-ring-group li')];
      const clipped = [...document.querySelectorAll('.kws-cyl *, .kws-ring *')].filter(e => { if (!vis(e)) return false; const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).length;
      const cut = [...document.querySelectorAll('.kws-cyl *, .kws-ring *')].filter(e => vis(e) && (e.scrollWidth > e.clientWidth + 1) && getComputedStyle(e).overflow !== 'visible').length;
      return { cards: cards.length, cardsVis: cards.filter(vis).length, lis: lis.length, lisVis: lis.filter(vis).length, stage: [...document.querySelectorAll('.kws-ring-stage')].map(e => getComputedStyle(e).display).join(), ctl: document.querySelectorAll('.kws-cyl-ctl').length, clipped, cut, sw: document.documentElement.scrollWidth - innerWidth, cylPadB: getComputedStyle(document.querySelector('.kws-cyl')).paddingBottom, cols: getComputedStyle(document.querySelector('.kws-cyl-track')).gridTemplateColumns.split(' ').length, h: document.querySelector('.kws-cyl').offsetHeight };
    });
    ok(r.cardsVis === r.cards && r.lisVis === r.lis && r.stage.indexOf('block') < 0 && r.ctl === 0 && r.clipped === 0 && r.sw <= 0, `script off ${w}px: all cards and list items visible, no stage, nothing past the edge`, JSON.stringify(r));
    await p.screenshot({ path: `shots/noscript-${w}.png`, fullPage: true });
    await p.ctx.close();
  }
  // ---- CLS with scripts arriving late
  const cls = async (o, label, url = DEMO) => {
    const delay = ctx => ctx.route(/kit\/depth\/(cylinder|ring)\.js/, async r => { await new Promise(x => setTimeout(x, o.delay || 1500)); r.continue(); });
    const p = await open(b, url, { ...o, route: delay, wait: 0, init: `(${(pre) => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => (s.node && (s.node.className || s.node.nodeName)) + ' ' + Math.round(s.previousRect.height) + '>' + Math.round(s.currentRect.height) + ' y' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y)) }); } } }).observe({ type: 'layout-shift', buffered: true }); if (pre) document.documentElement.setAttribute('data-motion', 'off'); }})(${!!o.pre})` });
    const before = await p.evaluate(() => ({ live: document.querySelectorAll('.is-live').length, cyl: [...document.querySelectorAll('.kws-cyl')].map(e => Math.round(e.getBoundingClientRect().height)), ring: [...document.querySelectorAll('.kws-ring')].map(e => Math.round(e.getBoundingClientRect().height)), doc: document.documentElement.scrollHeight }));
    await p.waitForTimeout((o.delay || 1500) + 1200);
    const after = await p.evaluate(() => ({ live: document.querySelectorAll('.is-live').length, cyl: [...document.querySelectorAll('.kws-cyl')].map(e => Math.round(e.getBoundingClientRect().height)), ring: [...document.querySelectorAll('.kws-ring')].map(e => Math.round(e.getBoundingClientRect().height)), doc: document.documentElement.scrollHeight, cls: window.__cls, shifts: window.__shifts }));
    ok(after.cls < 0.001 && before.doc === after.doc, `CLS ${label}`, `cls ${after.cls.toFixed(4)}; live ${before.live}>${after.live}; doc height ${before.doc}>${after.doc}; cyl ${before.cyl}>${after.cyl}; ring ${before.ring}>${after.ring}; shifts ${JSON.stringify(after.shifts).slice(0, 400)}`);
    await p.ctx.close();
  };
  for (const w of [390, 820, 1440]) await cls({ w, h: 844 }, `${w}px, scripts 1.5s late`);
  for (const w of [390, 1440]) await cls({ w, h: 844, rm: true }, `${w}px, scripts 1.5s late, prefers-reduced-motion: reduce`);
  for (const w of [390]) await cls({ w, h: 844, pre: true }, `${w}px, scripts 1.5s late, html[data-motion=off] set before paint`);
  for (const w of [390, 1440]) await cls({ w, h: 844, delay: 4800 }, `${w}px, scripts 4.8s late (after the 4s hold has run out)`);
  for (const w of [390, 1440]) await cls({ w, h: 844 }, `${w}px, bare page (no html.js), scripts 1.5s late`, BARE);
  await b.close();
})();
