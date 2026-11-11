// node shot.js WIDTH SELECTOR OUT [theme] [height] [pad] [nth]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [,, W, SEL, OUT, THEME = 'light', H = '900', PAD = '16', NTH = '0'] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, reducedMotion: 'reduce', colorScheme: THEME, deviceScaleFactor: 2 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, THEME);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.addStyleTag({ content: '.site-header{position:static!important} #mobile-cta{display:none!important}' });
  const el = p.locator(SEL).nth(+NTH); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const box = await el.boundingBox(); const pad = +PAD;
  await p.screenshot({ path: OUT, fullPage: true, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y + await p.evaluate(() => scrollY) - pad), width: Math.min(+W - Math.max(0, box.x - pad), box.width + pad * 2), height: box.height + pad * 2 } });
  await b.close();
})();
