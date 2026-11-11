const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, s] of [[1024, 'light'], [760, 'dark'], [600, 'light'], [360, 'dark'], [1920, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: s, reducedMotion: 'reduce' });
    await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    // make header non-sticky for a clean full-page picture
    await p.addStyleTag({ content: '.site-header{position:static!important} .mobile-cta{display:none!important}' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); }); await p.waitForTimeout(400);
    const parts = Math.ceil(H / 1600);
    for (let i = 0; i < parts; i++) await p.screenshot({ path: `work/start/eng/full-${w}-${s}-${i}.png`, clip: { x: 0, y: i * 1600, width: w, height: Math.min(1600, H - i * 1600) }, fullPage: true });
    console.log(w, s, H, parts);
    await ctx.close();
  }
  await b.close();
})();
