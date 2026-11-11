// node snapw.js width height out.png [selector|y] : one viewport or one element at a width
const { chromium } = require('playwright');
(async () => {
  const [w, h, out, what, theme] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5], process.argv[6] || 'light'];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce', colorScheme: theme });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(process.env.URL || 'http://localhost:8720/services/'); await p.waitForTimeout(500);
  if (what && isNaN(+what)) { const el = await p.$(what); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await el.screenshot({ path: out }); }
  else { await p.evaluate(y => scrollTo(0, y), +(what || 0)); await p.waitForTimeout(400); await p.screenshot({ path: out }); }
  await b.close();
})();
