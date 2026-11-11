const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  p.on('console', m => console.log('console', m.type(), m.text()));
  p.on('pageerror', e => console.log('pageerror', String(e)));
  await p.goto('http://localhost:8720/'); await p.waitForTimeout(500);
  await p.evaluate(() => window.scrollTo(0, 1600)); await p.waitForTimeout(700);
  console.log(await p.evaluate(() => { const m = document.getElementById('mobile-cta'); const cs = getComputedStyle(m); return { hidden: m.hidden, cls: m.className, display: cs.display, vis: cs.visibility, transform: cs.transform, rect: JSON.stringify(m.getBoundingClientRect()) }; }));
  await b.close();
})();
