// Full-page screenshot cut into parts. node shot.js WIDTH [scheme] [prefix]
const { chromium } = require('playwright');
(async () => {
  const w = parseInt(process.argv[2] || '390', 10), scheme = process.argv[3] || 'light', pre = process.argv[4] || 'r1';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce', deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.evaluate(() => { const m = document.getElementById('mobile-cta'); if (m) m.style.display = 'none'; document.querySelector('.site-header').style.position = 'static'; });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  const part = w < 700 ? 1500 : 1400;
  for (let y = 0, i = 0; y < H; y += part, i++) {
    await p.screenshot({ path: `${__dirname}/${pre}-${w}-${scheme}-${i}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(part, H - y) } });
  }
  console.log(w, scheme, 'height', H);
  await b.close();
})();
