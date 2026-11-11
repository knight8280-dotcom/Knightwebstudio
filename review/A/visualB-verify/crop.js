// node crop.js <out.png> <path> <selector> <width> [theme] [index] [padY] [injectJS file]
const { chromium } = require('playwright');
const fs = require('fs');
const base = process.env.BASE || 'http://localhost:8720';
(async () => {
  const [out, p, sel, w, theme = 'light', idx = '0', pad = '120', inject] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: +w, height: 900 }, colorScheme: theme, deviceScaleFactor: 2 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (inject) await page.evaluate(fs.readFileSync(inject, 'utf8'));
  const el = page.locator(sel).nth(+idx);
  await el.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in', 'in', 'is-visible')));
  await page.waitForTimeout(700);
  const b = await el.boundingBox();
  const vp = page.viewportSize();
  const y0 = Math.max(0, b.y - +pad), y1 = Math.min(vp.height, b.y + b.height + +pad);
  await page.screenshot({ path: out, clip: { x: 0, y: y0, width: vp.width, height: y1 - y0 } });
  await browser.close();
})();
