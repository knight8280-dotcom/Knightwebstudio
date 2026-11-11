// Held state before the script arrives: normal vs reduced motion vs data-motion=off. Component placed in the first viewport
// (scrolled to it is not possible before load, so we measure heights and positions directly and also CLS with a tall viewport).
const { chromium, DEMO, log, ok } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [label, o] of [['normal', {}], ['prefers-reduced-motion', { rm: true }], ['data-motion=off before paint', { pre: true }], ['data-motion=off + a site rule that stops animations (as the reduced-motion rule does)', { pre: true, rule: true }]]) {
    for (const w of [390, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 3000 }, reducedMotion: o.rm ? 'reduce' : 'no-preference' });
      let release; const gate = new Promise(r => release = r);
      await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, async r => { await gate; r.continue(); });
      await ctx.addInitScript(`(${(pre, rule) => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(+e.value.toFixed(4)); } }).observe({ type: 'layout-shift', buffered: true });
        if (pre) document.documentElement.setAttribute('data-motion', 'off');
        if (rule) document.addEventListener('readystatechange', () => { if (!document.getElementById('x-rule') && document.head) { const s = document.createElement('style'); s.id = 'x-rule'; s.textContent = '[data-motion=off] *, [data-motion=off] *::before, [data-motion=off] *::after { animation: none !important; transition: none !important; }'; document.head.append(s); } }); }})(${!!o.pre}, ${!!o.rule})`);
      const p = await ctx.newPage();
      p.goto(DEMO, { waitUntil: 'commit' }).catch(() => {});
      await p.waitForTimeout(900);
      const m = () => p.evaluate(() => ({ live: document.querySelectorAll('.is-live').length, cyl: Math.round(document.querySelector('.kws-cyl').getBoundingClientRect().height), shown: [...document.querySelector('.kws-cyl').querySelectorAll('.kws-cyl-card')].filter(c => getComputedStyle(c).visibility !== 'hidden').length, doc: document.documentElement.scrollHeight, cls: +window.__cls.toFixed(4), anim: getComputedStyle(document.querySelector('.kws-cyl-card + .kws-cyl-card')).animationName }));
      const held = await m();
      if (label !== 'normal' || w === 390) await p.screenshot({ path: `shots/held-${label.replace(/[^a-z]+/gi, '-').slice(0, 30)}-${w}.png` });
      release(); await p.waitForTimeout(1500);
      const live = await m();
      ok(held.cyl === live.cyl && live.cls < 0.001, `${label}, ${w}px: space held before the script (viewport 3000px tall so shifts count)`, `held ${JSON.stringify(held)} > live ${JSON.stringify(live)}`);
      await ctx.close();
    }
  }
  await b.close();
})();
