// node full.js w h out.png [theme] [open] : a full-page picture at one width (reveals shown)
const { chromium } = require('playwright');
(async () => {
  const [w, h, out, theme, open] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5] || 'light', process.argv[6]];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce', colorScheme: theme });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(process.env.URL || 'http://localhost:8720/services/'); await p.waitForTimeout(500);
  if (open) await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
  await p.evaluate(() => { const m = document.getElementById('mobile-cta'); if (m) m.style.display = 'none'; });
  await p.waitForTimeout(200);
  const main = await p.$('main'); await main.screenshot({ path: out });
  await b.close();
})();
