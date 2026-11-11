// node parts.js WIDTH sel1 sel2 ... -> heights of all matches
const { chromium } = require('playwright');
(async () => {
  const w = parseInt(process.argv[2], 10); const sels = process.argv.slice(3);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 800 }, isMobile: w < 700, hasTouch: w < 700 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(process.env.URL || 'http://localhost:8720/', { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const r = await p.evaluate(sels => sels.map(s => [s, [...document.querySelectorAll(s)].map(e => { const b = e.getBoundingClientRect(); return Math.round(b.height) + '@' + Math.round(b.top + scrollY) + ' w' + Math.round(b.width); })]), sels);
  for (const [s, v] of r) console.log(s.padEnd(34), v.join('  '));
  await b.close();
})();
