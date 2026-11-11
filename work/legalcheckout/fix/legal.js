// Legal pages: the pinned contents list in short windows, anchors, and text zoom on a phone.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const pg of ['privacy', 'terms']) {
    for (const [w, h] of [[1440, 900], [1280, 560], [1093, 520], [1280, 640], [1280, 620], [1000, 600], [1440, 700]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.route(/plausible/, r => r.abort()); const p = await ctx.newPage();
      await p.goto(`http://localhost:8720/${pg}/`); await p.evaluate(() => scrollTo(0, 1400)); await p.waitForTimeout(500);
      const m = await p.evaluate(() => { const t = document.querySelector('.toc'), r = t.getBoundingClientRect(), last = t.querySelector('li:last-child a').getBoundingClientRect(); return { pos: getComputedStyle(t).position, top: Math.round(r.top), bottom: Math.round(r.bottom), lastBottom: Math.round(last.bottom), vh: innerHeight }; });
      // focus the last link and see whether it is on screen
      await p.evaluate(() => document.querySelector('.toc li:last-child a').focus({ preventScroll: true }));
      const f = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
      console.log(pg, w + 'x' + h, JSON.stringify(m), m.pos === 'sticky' ? (m.lastBottom + 6 <= m.vh ? 'pinned, all visible' : 'PINNED AND CUT') : 'released', 'last link focus on screen without scroll:', f);
      if (w === 1093) await p.screenshot({ path: `legal_${pg}_${w}x${h}.png` });
      await ctx.close(); }
    for (const [w, z] of [[320, 2], [360, 2], [400, 2], [390, 1], [820, 2]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); await ctx.route(/plausible/, r => r.abort()); const p = await ctx.newPage();
      await p.goto(`http://localhost:8720/${pg}/`); if (z > 1) await p.evaluate(z => { document.documentElement.style.fontSize = z * 100 + '%'; }, z); await p.waitForTimeout(200);
      const m = await p.evaluate(() => { const c = document.querySelector('main .split').getBoundingClientRect(); const bad = [];
        for (const e of document.querySelectorAll('main .split *')) { if (!e.offsetParent) continue; const r = e.getBoundingClientRect(); if (r.width && r.right > c.right + 1) bad.push(e.tagName + (e.className ? '.' + e.className : '') + ' +' + Math.round(r.right - c.right)); }
        return bad.slice(0, 6); });
      console.log(pg, w, 'text x' + z, m.length ? 'PAST THE CONTAINER: ' + m.join(' | ') : 'clean');
      if (z > 1 && w === 360) await p.screenshot({ path: `legal_${pg}_zoom_${w}.png`, fullPage: true });
      await ctx.close(); } }
  await b.close(); })();
