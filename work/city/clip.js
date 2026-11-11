// node clip.js URL SELECTOR OUT [width] [theme]  : screenshot of one element (full element, even if taller than the viewport)
const { chromium } = require('playwright');
(async () => {
  const [url, sel, out, width = '390', theme = 'light', pad = '0'] = process.argv.slice(2);
  const w = +width;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, isMobile: w < 700, hasTouch: w < 700, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.addStyleTag({ content: '.site-header{position:static!important}.mobile-cta{display:none!important}' });
  const el = p.locator(sel).first();
  await el.screenshot({ path: out });
  await b.close();
})();
