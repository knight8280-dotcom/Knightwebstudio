const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const id of ['packages', 'payment', 'addons', 'consulting', 'care', 'pricing']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/#' + id, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const r = await p.evaluate(id => { const t = document.getElementById(id); const tr = t.getBoundingClientRect(); const hd = document.getElementById('site-header').getBoundingClientRect();
      const inView = [...document.querySelectorAll('.reveal')].filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight * .85 && r.bottom > hd.bottom + 40; });
      return { top: Math.round(tr.top), headerBottom: Math.round(hd.bottom), fadedInView: inView.filter(e => +getComputedStyle(e).opacity < 0.99).map(e => (e.id || e.className).slice(0, 30)), scrollY: Math.round(scrollY) }; }, id);
    console.log(w, '#' + id, JSON.stringify(r), r.top >= r.headerBottom - 1 && r.top < 200 ? 'ok' : 'CHECK', r.fadedInView.length ? 'FADED CONTENT IN VIEW' : '');
    await ctx.close();
  }
  await b.close();
})();
