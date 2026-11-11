// Full-page screenshot at a width: node full.js <width> <height> <light|dark> <out.png>
const { chromium } = require('playwright');
(async () => {
  const [w, h, theme, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.addStyleTag({ content: '.mobile-cta{display:none!important}.site-header{position:static!important}' });
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
