const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
let browser;
async function open(p, w, opts = {}) {
  if (!browser) browser = await chromium.launch();
  const theme = opts.theme || 'light';
  const h = opts.h || (w < 600 ? 844 : w < 1000 ? 1100 : w >= 1920 ? 1080 : w >= 1440 ? 900 : 800);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: opts.dsf || 1, colorScheme: theme, isMobile: w < 600, hasTouch: w < 600 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto(BASE + p, { waitUntil: 'load' });
  await page.waitForTimeout(350);
  if (opts.revealAll !== false) {
    // make every reveal visible without scrolling the whole page
    await page.evaluate(() => { document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')); });
    await page.waitForTimeout(150);
  }
  page._ctx = ctx;
  return page;
}
async function done(page) { await page._ctx.close(); }
async function close() { if (browser) await browser.close(); }
// screenshot an element region with padding, scrolled into view
async function shotEl(page, selector, file, pad = 24) {
  const loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await loc.boundingBox();
  const vp = page.viewportSize();
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(vp.width - Math.max(0, box.x - pad), box.width + pad * 2), height: Math.min(vp.height - Math.max(0, box.y - pad), box.height + pad * 2) };
  await page.screenshot({ path: file, clip });
}
module.exports = { open, done, close, shotEl, BASE };
