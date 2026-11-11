// node view.js URL OUT width height scrollY [theme] [scale] : one viewport screenshot at a scroll position
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = '390', h = '844', y = '0', theme = 'light', scale = '2'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, colorScheme: theme, isMobile: +w < 700, hasTouch: +w < 700, deviceScaleFactor: +scale });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  await p.evaluate(y => window.scrollTo(0, y), +y);
  await p.waitForTimeout(700);
  await p.screenshot({ path: out });
  await b.close();
})();
