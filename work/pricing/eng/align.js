const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 960, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  for (const w of [390, 600, 760, 820, 900, 940, 960, 979, 980, 1100, 1440]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(100);
    console.log(w, JSON.stringify(await p.evaluate(() => { const q = s => document.querySelector(s); const R = e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.height)]; }; const c = q('.page-head .container');
      const cards = [...document.querySelectorAll('.spec tbody tr')].map(t => Math.round(t.getBoundingClientRect().height));
      const acts = [...document.querySelectorAll('.spec-act .btn-block')].map(t => Math.round(t.getBoundingClientRect().top + scrollY));
      const pl = [...document.querySelectorAll('.pricelist')].map(R); const rc = R(q('.receipt'));
      return { container: R(c).slice(0, 2), tocCard: R(q('.toc.card')).slice(0, 2), cards, btnTops: acts, payplan: R(q('.payplan')), addonsList: pl[0], receipt: rc, careTable: R(q('.table')).slice(0, 2), careCard: R(q('#care .card')).slice(0, 2), careBtns: [...document.querySelectorAll('.table .btn')].map(e => R(e).slice(0, 2).join('-')) }; })));
  }
  await p.setViewportSize({ width: 940, height: 900 }); await p.waitForTimeout(150); await p.screenshot({ path: 'shots/top-940.png' });
  await b.close();
})();
