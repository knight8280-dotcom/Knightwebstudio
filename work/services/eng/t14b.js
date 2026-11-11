const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) { const ctx = await b.newContext({ viewport: { width: w, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  for (const h of ['/pricing/#care', '/pricing/#packages']) { await p.goto('http://localhost:8720' + h); for (const t of [300, 1000, 2500]) { await p.waitForTimeout(t); console.log(w, h, 'after +' + t, await p.evaluate(() => { const t = document.getElementById(location.hash.slice(1)); return [Math.round(t.getBoundingClientRect().top), Math.round(scrollY), document.documentElement.scrollHeight]; })); } }
  // click from services page (same-tab navigation)
  await p.goto('http://localhost:8720/services/'); await p.locator('a[href="/pricing/#care"]').click(); await p.waitForTimeout(3000);
  console.log(w, 'clicked from services:', await p.evaluate(() => [location.pathname + location.hash, Math.round(document.getElementById('care').getBoundingClientRect().top)]));
  await ctx.close(); }
  await b.close();
})();
