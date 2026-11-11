// node anim.js OUT WIDTHxHEIGHT t1,t2,... : hero screenshots at given ms after load
const { chromium } = require('playwright');
(async () => {
  const [out, size, times] = process.argv.slice(2);
  const [w, h] = size.split('x').map(Number);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/', { waitUntil: 'commit' });
  const t0 = Date.now();
  for (const t of times.split(',').map(Number)) {
    const d = t - (Date.now() - t0); if (d > 0) await p.waitForTimeout(d);
    await p.screenshot({ path: `${out}/anim-${String(t).padStart(4, '0')}.png`, clip: { x: w * .5, y: 140, width: w * .5, height: h - 140 } });
  }
  await b.close();
})();
