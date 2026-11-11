// node m2.js [width] [height] : heights of the page's blocks
const { chromium } = require('playwright');
(async () => {
  const w = +(process.argv[2] || 390), h = +(process.argv[3] || 844);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const out = [];
    const sel = ['.page-head', '.page-head h1', '.menu', '.menu .board-head', '.menu li', '#build', '#website-design', '#ecommerce', '#redesigns', '#brand', '#seo', '#keep', '#care', '#win', '#automation', '#google-reviews', '#growth-consulting', '.cta-band', '.site-footer'];
    for (const s of sel) { const els = [...document.querySelectorAll(s)]; if (!els.length) { out.push(s + '  --'); continue; }
      out.push(s.padEnd(22) + els.map(el => { const rc = el.getBoundingClientRect(); return `top ${Math.round(rc.top + scrollY)} h ${Math.round(rc.height)}`; }).slice(0, 10).join(' | ')); }
    out.push('TOTAL ' + document.documentElement.scrollHeight + '  overflow-x ' + (document.documentElement.scrollWidth - innerWidth));
    return out;
  });
  console.log(r.join('\n'));
  await b.close();
})();
