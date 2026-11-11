// Section heights at a given width: node m.js [width]
const { chromium } = require('playwright');
(async () => {
  const w = +(process.argv[2] || 390);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const out = [];
    for (const s of document.querySelectorAll('main > section')) out.push([(s.id || s.className).slice(0, 30), Math.round(s.getBoundingClientRect().height)]);
    for (const sel of ['.page-head .lede', '.toc', '#time', '.bigfig', '.sheet', '.auto', '.auto .fig-art', '.auto figcaption', '.calc', '.calc-inputs', '.calc .receipt', '#process .section-head', '.path > li', '.plans', '#bundle', '.faq', '.site-footer'])
      out.push([sel, [...document.querySelectorAll(sel)].map(e => Math.round(e.getBoundingClientRect().height)).join(' ')]);
    out.push(['PAGE', document.documentElement.scrollHeight]);
    out.push(['scrollW', document.documentElement.scrollWidth]);
    return out;
  });
  for (const [k, v] of r) console.log(String(k).padEnd(34), v);
  await b.close();
})();
