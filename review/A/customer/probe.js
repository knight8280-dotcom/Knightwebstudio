const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto('http://localhost:8720/', { waitUntil: 'load' }); await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const q = s => [...document.querySelectorAll(s)].map(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { s, cls: e.className, display: cs.display, w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top + scrollY) }; });
    return { appt: q('.cta-band [class*="appt"], .cta-band .card, .cta-band aside, .cta-band .ticket'), secondary: q('.hero .btn-row a'), tiers: q('.board a.tier').map(x => ({ h: x.h, y: x.y })), tierStyle: (() => { const a = document.querySelector('.board a.tier'); const cs = getComputedStyle(a); return { textDecoration: cs.textDecorationLine, cursor: cs.cursor, hasArrow: !!a.querySelector('svg'), after: getComputedStyle(a, '::after').content }; })() };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
