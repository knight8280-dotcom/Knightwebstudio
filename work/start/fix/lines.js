// Line widths of the lede, the closing paragraph and the facts shelf at several widths
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 390, 430, 600, 980, 1024, 1040, 1100, 1180, 1280, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 700, hasTouch: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
      const lines = el => { const rg = document.createRange(); rg.selectNodeContents(el); const by = new Map(); for (const r of rg.getClientRects()) { if (r.width < 1) continue; const k = Math.round(r.top / 6); const o = by.get(k) || [1e9, -1e9]; by.set(k, [Math.min(o[0], r.left), Math.max(o[1], r.right)]); } return [...by.values()].map(v => Math.round(v[1] - v[0])); };
      const q = s => document.querySelector(s);
      return { ledeCol: Math.round(q('.lede').getBoundingClientRect().width), lede: lines(q('.lede')), cta: lines(q('.cta-copy > p')), ctaCol: Math.round(q('.cta-copy > p').getBoundingClientRect().width), points: [...document.querySelectorAll('.points li span')].map(s => lines(s).length).join('/'), eyebrow: lines(q('.page-head .eyebrow')), sub: lines(q('#work .section-sub')) };
    });
    console.log(w, JSON.stringify(m));
    await ctx.close();
  }
  await b.close();
})();
