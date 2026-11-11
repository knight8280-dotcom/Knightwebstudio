const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  // real zoom stand-in: a 1366x648 window at deviceScaleFactor 4 is a 341x162 CSS viewport
  const ctx = await b.newContext({ viewport: { width: 341, height: 162 }, deviceScaleFactor: 2 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const top = await p.evaluate(() => { const t = document.querySelector('#care table.table-stack'); return Math.round(t.getBoundingClientRect().top + scrollY); });
  // wheel-scroll down to and through the table in small steps, as a reader would
  for (let y = top - 400; y < top + 1100; y += 40) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(40); }
  await p.evaluate(yy => scrollTo(0, yy), top + 200); await p.waitForTimeout(1500);
  const st = await p.evaluate(() => { const t = document.querySelector('#care table.table-stack'); const r = t.getBoundingClientRect(); return { opacity: getComputedStyle(t).opacity, visibleClass: t.classList.contains('visible'), tableTop: Math.round(r.top), tableH: Math.round(r.height), vh: innerHeight, maxRatio: +(((innerHeight - 96)) / r.height).toFixed(3) }; });
  console.log(JSON.stringify(st));
  await p.screenshot({ path: 'shots/v01_341x162_pricing_care_window.png' });
  // focus the first plan button
  const name = await p.evaluate(() => { const a = document.querySelector('#care table.table-stack a'); a.focus(); return a.getAttribute('aria-label') || a.textContent; });
  await p.waitForTimeout(800);
  console.log('focused:', name, '| table opacity now', await p.evaluate(() => getComputedStyle(document.querySelector('#care table.table-stack')).opacity));
  await p.screenshot({ path: 'shots/v01_341x162_pricing_care_focus.png' });
  // tall capture of the region
  await p.setViewportSize({ width: 341, height: 162 });
  await b.close();
})();
