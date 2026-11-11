const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const w of [390, 1280]) { const ctx = await ctxFor(b, { w, h: 844, theme, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300);
    if (w < 1100) { await p.click('#nav-toggle'); await p.waitForTimeout(400); }
    const r = await p.evaluate(() => { const g = a => { const cs = getComputedStyle(a); const af = getComputedStyle(a, '::after'); const be = getComputedStyle(a, '::before'); return { color: cs.color, weight: cs.fontWeight, deco: cs.textDecorationLine, borderB: cs.borderBottomWidth + ' ' + cs.borderBottomColor, after: af.content + ' bg=' + af.backgroundColor + ' h=' + af.height + ' w=' + af.width + ' op=' + af.opacity + ' tr=' + af.transform, before: be.content }; }; return { current: g(document.querySelector('#nav [aria-current]')), other: g(document.querySelector('#nav a:not([aria-current])')) }; });
    console.log(theme, w, JSON.stringify(r, null, 0)); await ctx.close(); }
  await b.close(); })();
