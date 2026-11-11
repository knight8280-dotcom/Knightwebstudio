// node snap.js <width> <height> <theme> <out> [selector|y] [open]
const { chromium } = require('playwright');
(async () => {
  const [w, h, theme, out, target, open] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, colorScheme: theme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(process.env.URL || 'http://localhost:8720/services/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  if (open === 'open') await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
  if (target === 'full') { await p.screenshot({ path: out, fullPage: true }); }
  else if (target && isNaN(+target)) { await p.locator(target).first().scrollIntoViewIfNeeded(); await p.evaluate(s => { const e = document.querySelector(s); scrollTo({ top: e.getBoundingClientRect().top + scrollY - 90, behavior: 'instant' }); }, target); await p.waitForTimeout(300); await p.screenshot({ path: out }); }
  else { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), +target || 0); await p.waitForTimeout(300); await p.screenshot({ path: out }); }
  await b.close();
})();
