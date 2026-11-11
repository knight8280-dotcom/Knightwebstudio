const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, s] of [[390, 664, 'light'], [375, 548, 'light'], [360, 640, 'dark'], [600, 900, 'light'], [1000, 700, 'light'], [1280, 800, 'light'], [1100, 800, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: s, deviceScaleFactor: 1 });
    await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
    await p.screenshot({ path: `work/start/eng/fold-${w}x${h}-${s}.png` });
    console.log(w, h, JSON.stringify(await p.evaluate(() => { const q = s => Math.round(document.querySelector(s).getBoundingClientRect().bottom); return { h1: q('h1'), lede: q('.lede'), book: q('.page-head .btn-primary'), call: q('.page-head .btn-row a:last-child'), nums: q('.price-strip-nums'), strip: q('.price-strip'), points: q('.points'), scene: q('.page-head-aside') }; })));
    await ctx.close();
  }
  await b.close();
})();
