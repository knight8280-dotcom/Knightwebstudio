// node full.js WIDTH [theme] [height] -> full page screenshot cut into tiles of N px
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [,, W, THEME = 'light', TILE = '1600', EXTRA = ''] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +W, height: 900 }, reducedMotion: 'reduce', colorScheme: THEME, deviceScaleFactor: 1, javaScriptEnabled: EXTRA !== 'nojs' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, THEME);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.waitForTimeout(600);
  if (EXTRA !== 'nojs') { await p.evaluate(() => document.fonts.ready); await p.addStyleTag({ content: '.site-header{position:static!important} #mobile-cta{display:none!important}' }); }
  const h = await p.evaluate(() => document.documentElement.scrollHeight); const tile = +TILE; let i = 0;
  for (let y = 0; y < h; y += tile) { i++; await p.screenshot({ path: `full-${W}-${THEME}${EXTRA ? '-' + EXTRA : ''}-${String(i).padStart(2, '0')}.png`, fullPage: true, clip: { x: 0, y, width: +W, height: Math.min(tile, h - y) } }); }
  console.log(W, THEME, EXTRA, 'height', h, 'tiles', i);
  await b.close();
})();
