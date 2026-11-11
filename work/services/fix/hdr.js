// Does white-space: nowrap on the header button fit at every width from 1100? Checks scrolled and unscrolled.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
  const out = [];
  for (const patch of [false, true]) {
    if (patch) await p.addStyleTag({ content: '.site-header .header-cta{white-space:nowrap}' });
    for (let w = 1100; w <= 1320; w += 4) {
      await p.setViewportSize({ width: w, height: 800 });
      for (const y of [0, 600]) {
        await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(patch ? 380 : 60);
        const r = await p.evaluate(() => {
          const R = e => e.getBoundingClientRect(); const q = s => document.querySelector(s);
          const cta = R(q('.site-header .header-cta')), inner = R(q('.header-inner')), nav = R(q('.nav-links')), acts = R(q('.header-actions'));
          const tel = q('.header-tel'); const tr = tel ? R(tel) : null;
          return { ctaH: Math.round(cta.height), ctaRight: Math.round(cta.right), innerRight: Math.round(inner.right), navRight: Math.round(nav.right), actsLeft: Math.round(acts.left), telLeft: tr && tr.width ? Math.round(tr.left) : null, over: document.documentElement.scrollWidth - innerWidth };
        });
        if (r.ctaH > 44 || r.ctaRight > r.innerRight + 1 || r.navRight > r.actsLeft || r.over > 0) out.push([patch ? 'nowrap' : 'as-is', w, y, JSON.stringify(r)].join(' '));
      }
    }
  }
  console.log(out.join('\n') || 'no problems');
  await b.close();
})();
