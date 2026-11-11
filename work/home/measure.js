// node measure.js [width] [url]  -> heights of each <main> child section and total
const { chromium } = require('playwright');
(async () => {
  const w = parseInt(process.argv[2] || '390', 10);
  const url = process.argv[3] || 'http://localhost:8720/';
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 800 }, isMobile: w < 700, hasTouch: w < 700, colorScheme: 'light' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.topbar, .site-header, main > *, .site-footer')) {
      const b = el.getBoundingClientRect();
      out.push([(el.id || el.className || el.tagName).toString().slice(0, 40), Math.round(b.height), Math.round(b.top + scrollY)]);
    }
    return { out, total: document.documentElement.scrollHeight, ovf: document.documentElement.scrollWidth - innerWidth };
  });
  for (const [n, h, t] of r.out) console.log(String(h).padStart(6), String(t).padStart(6), n);
  console.log('TOTAL', r.total, 'overflowX', r.ovf);
  await b.close();
})();
