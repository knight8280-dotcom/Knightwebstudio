// node snap.js URL out.png width height [scrollY] [dark] [fullPage]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w, h, y, dark, full] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, colorScheme: dark === 'dark' ? 'dark' : 'light', isMobile: +w < 700, hasTouch: +w < 700, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, dark === 'dark' ? 'dark' : 'light');
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(500);
  if (+y) { await p.evaluate(v => scrollTo(0, v), +y); await p.waitForTimeout(400); }
  await p.screenshot({ path: out, fullPage: full === 'full' });
  await b.close();
})();
