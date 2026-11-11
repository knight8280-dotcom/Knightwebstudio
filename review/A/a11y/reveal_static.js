// For every control inside a .reveal block: when a nearest-edge browser brings it into view from above (bottom edge at viewport bottom minus scroll-padding-bottom),
// how much of its block is inside the observer's root? Below the 0.08 threshold the block stays at opacity 0 with focus inside it.
const { chromium, BASE, PAGES, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 820, 1280]) for (const path of PAGES) {
    const h = w === 390 ? 844 : 800; const ctx = await ctxFor(b, { w, h, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const spb = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) || 0; const foot = document.getElementById('mobile-cta') && matchMedia('(max-width: 1099.98px)').matches ? 96 : 24; const out = [];
      for (const el of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary')) { const rv = el.closest('.reveal'); if (!rv || !el.checkVisibility({ checkVisibilityCSS: true })) continue; const er = el.getBoundingClientRect(), br = rv.getBoundingClientRect();
        // control bottom sits at vh - spb ; root bottom at vh - foot ; root top at 0
        const blockTopInView = innerHeight - spb - (er.bottom - br.top); const visTop = Math.max(0, blockTopInView); const visBottom = Math.min(innerHeight - foot, blockTopInView + br.height); const ratio = Math.max(0, visBottom - visTop) / br.height;
        if (ratio < 0.09) out.push({ text: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 40), ratio: +ratio.toFixed(3), blockH: Math.round(br.height), offsetBottom: Math.round(er.bottom - br.top), block: rv.tagName.toLowerCase() + '.' + rv.className.replace(/\s+/g, '.'), spb, foot }); }
      return out; });
    if (r.length) { console.log(`=== ${path} @${w}`); r.forEach(x => console.log('   ' + JSON.stringify(x))); }
    await ctx.close();
  }
  await b.close();
})();
