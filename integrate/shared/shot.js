// shot.js URL WIDTH HEIGHT OUT [selector] [theme] [scrollY] : one screenshot of the viewport, or of one element
const { chromium } = require('playwright');
(async () => { const [url, w, h, out, sel, theme, sy] = process.argv.slice(2); const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, reducedMotion: 'reduce', colorScheme: theme || 'light' }); await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme || 'light');
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  if (sy) { await p.evaluate(v => scrollTo(0, +v), sy); await p.waitForTimeout(400); }
  if (sel && sel !== '-') { const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await l.screenshot({ path: out }); } else await p.screenshot({ path: out });
  await b.close(); })();
