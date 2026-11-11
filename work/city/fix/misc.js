// 1. the plain fallback of the name (no container units)  2. text-only zoom 200%: stamp against the town labels
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const R = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  for (const town of ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']) {
    for (const w of [360, 390, 820, 1280, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
      const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${town}/`); await p.evaluate(() => document.fonts.ready);
      // fallback
      await p.addStyleTag({ content: '[data-page="city"] .city-title > .city-name{font-size:var(--fs-h1)!important}' });
      const fb = await p.evaluate(() => { const m = document.querySelector('.city-name .mark').getBoundingClientRect(), h = document.querySelector('.city-title').getBoundingClientRect(); return { fs: getComputedStyle(document.querySelector('.city-name')).fontSize, nameW: Math.round(m.width), col: Math.round(h.width), lines: Math.round(m.height / parseFloat(getComputedStyle(document.querySelector('.city-name')).fontSize)) }; });
      if (w === 390 && town === 'denham-springs') await p.locator('.page-head').screenshot({ path: __dirname + '/r2/fallback-ds-390.png' });
      if (w === 1440 && town === 'gonzales') await p.locator('.page-head').screenshot({ path: __dirname + '/r2/fallback-gz-1440.png' });
      await ctx.close();
      // text zoom
      const ctx2 = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
      const p2 = await ctx2.newPage(); await p2.goto(`http://localhost:8720/web-design-${town}/`); await p2.evaluate(() => document.fonts.ready);
      await p2.addStyleTag({ content: 'html{font-size:200%}' }); await p2.waitForTimeout(100);
      const z = await p2.evaluate(() => { const s = document.querySelector('.city-meet .stamp').getBoundingClientRect(); const hits = []; for (const el of document.querySelectorAll('.city-meet .pills li, .city-meet > p:not(.stamp), .city-meet h2')) { const r = el.getBoundingClientRect(); if (!(r.right <= s.left || s.right <= r.left || r.bottom <= s.top || s.bottom <= r.top)) hits.push(el.textContent.trim().slice(0, 20)); } return hits; });
      const z1 = await (async () => { const c3 = await b.newContext({ viewport: { width: w, height: 900 } }); const p3 = await c3.newPage(); await p3.goto(`http://localhost:8720/web-design-${town}/`); await p3.evaluate(() => document.fonts.ready); const r = await p3.evaluate(() => { const s = document.querySelector('.city-meet .stamp').getBoundingClientRect(); const hits = []; for (const el of document.querySelectorAll('.city-meet .pills li, .city-meet > p:not(.stamp), .city-meet h2')) { const r = el.getBoundingClientRect(); if (!(r.right <= s.left || s.right <= r.left || r.bottom <= s.top || s.bottom <= r.top)) hits.push(el.textContent.trim().slice(0, 20)); } const last = [...document.querySelectorAll('.city-meet .pills li')].pop().getBoundingClientRect(); return { hits, gap: Math.round(s.top - last.bottom) }; }); await c3.close(); return r; })();
      console.log(town.padEnd(15), String(w).padStart(4), 'fallback', JSON.stringify(fb), '| stamp overlaps at 100%:', JSON.stringify(z1), 'at 200% text:', JSON.stringify(z));
      await ctx2.close();
    }
  }
  await b.close();
})();
