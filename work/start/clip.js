// Screenshot one region: node clip.js <selector> <width> <light|dark> <out.png> [padTop] [padBottom] [height]
const { chromium } = require('playwright');
(async () => {
  const [sel, w, theme, out, padT = '40', padB = '40', vh = '900'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +vh }, deviceScaleFactor: 2, colorScheme: theme, isMobile: +w < 700, hasTouch: +w < 700, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.addStyleTag({ content: '.mobile-cta{display:none!important}.site-header{position:static!important}' });
  const box = await p.evaluate((sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; }, sel);
  await p.screenshot({ path: out, fullPage: true, clip: { x: 0, y: Math.max(0, box.y - +padT), width: +w, height: box.h + +padT + +padB } });
  await b.close();
})();
