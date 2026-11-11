const { chromium, URL, settle, scrollToSel } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
  for (const sel of ['#services .kws-arc', '#work .kws-spot']) {
    await scrollToSel(p, sel); await p.waitForTimeout(200);
    // time from focus landing on the next item's link until its caption opacity passes 0.1 / 0.5 / 1
    const r = await p.evaluate(s => new Promise(done => { const el = document.querySelector(s); const lis = [...el.querySelectorAll('li')]; const a = lis[1].querySelector('a'); const cap = lis[1].querySelector('[class$=-cap]'); const t0 = performance.now(); const out = {}; a.focus();
      const loop = () => { const o = parseFloat(getComputedStyle(cap).opacity), t = Math.round(performance.now() - t0); if (o > 0 && out.first === undefined) out.first = t; if (o >= .5 && out.half === undefined) out.half = t; if (o >= 1 && !el.classList.contains('is-moving')) { out.full = t; return done(out); } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
    console.log(sel, 'Tab to next link -> its caption (and so its focus ring) is invisible for', r.first, 'ms, half opacity at', r.half, 'ms, settled at', r.full, 'ms');
    // duration of springs: 1 step, 4 steps, 25 steps
    for (const n of [1, 4, 25]) { const d = await p.evaluate(([s, n]) => new Promise(done => { const el = document.querySelector(s); const nx = el.querySelector('button[aria-label^="Next"]'); const t0 = performance.now(); for (let i = 0; i < n; i++) nx.click(); const loop = () => { if (!el.classList.contains('is-moving')) return done(Math.round(performance.now() - t0)); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), [sel, n]); console.log('   spring for', n, 'step(s):', d, 'ms'); await p.waitForTimeout(150); }
  }
  await b.close();
})();
