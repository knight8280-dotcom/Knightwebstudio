const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sizes = (process.argv[2] || '360x740,390x844,430x932,600x900,768x1024,820x1100,980x800,1000x800,1024x768,1040x800,1100x800,1140x800,1280x800,1366x768,1440x900,1920x1080').split(',').map(s => s.split('x').map(Number));
const theme = process.argv[3] || 'light'; const full = process.argv[4] === 'full';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2800);
    const hero = await p.evaluate(() => { const r = document.querySelector('.hero').getBoundingClientRect(); return Math.ceil(r.bottom + scrollY); });
    await p.screenshot({ path: `hero_${w}x${h}_${theme}.png`, clip: { x: 0, y: 0, width: w, height: full ? Math.min(hero + 40, 2200) : h } });
    await ctx.close();
  }
  await b.close();
})();
