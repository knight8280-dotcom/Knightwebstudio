const { chromium } = require('playwright');
const FIX = `
@media (max-width: 1099.98px) { [data-page="pricing"] .spec tr { grid-template-rows: repeat(7, auto) 1fr; } [data-page="pricing"] .spec .spec-act { align-self: end; } [data-page="pricing"] .toc.card { max-width: none; } }
@supports (grid-template-rows: subgrid) { @media (min-width: 1100px) { [data-page="pricing"] .spec tr { grid-template-columns: minmax(0, 1fr); } [data-page="pricing"] .spec .spec-price { overflow-wrap: anywhere; } } }`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 760, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.addStyleTag({ content: FIX });
  const bad = []; let toc = [];
  for (let w = 360; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(40);
    const r = await p.evaluate(() => { const t = [...document.querySelectorAll('.spec-act .btn-block')].map(t => Math.round(t.getBoundingClientRect().top + scrollY)); const c = document.querySelector('.page-head .container').getBoundingClientRect(), k = document.querySelector('.toc.card').getBoundingClientRect(); return { t, gap: Math.round(c.right - k.right), over: document.documentElement.scrollWidth - innerWidth, priceLines: [...document.querySelectorAll('.spec-price')].map(td => { const rg = document.createRange(); rg.selectNode(td.firstChild); return rg.getClientRects().length; }) }; });
    if (w >= 760 && w < 1100 && (Math.abs(r.t[0] - r.t[1]) > 1 || Math.abs(r.t[2] - r.t[3]) > 1)) bad.push(w); if (w >= 1100 && new Set(r.t).size > 1) bad.push(w);
    if (w < 980 && r.gap > 1) toc.push(w + ':' + r.gap); if (r.over > 0) bad.push('overflow@' + w); if (r.priceLines.some(n => n > 1)) bad.push('price wraps@' + w); }
  console.log('with candidate fixes: misaligned/overflow/wrapped-price widths:', bad.join(' ') || 'none', '| toc card short of container:', toc.join(' ') || 'never');
  await b.close();
})();
