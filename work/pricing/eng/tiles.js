// node tiles.js WIDTH THEME [tileH] [zoomRootPct] -> shots/w{W}-{theme}-{nn}.png
const { chromium } = require('playwright');
const [W, theme, tileH = '1500', zoom = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +W, height: 900 }, reducedMotion: 'reduce', colorScheme: theme, deviceScaleFactor: 1 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  if (zoom) await p.evaluate(z => { document.documentElement.style.fontSize = z + '%'; }, zoom);
  await p.waitForTimeout(300);
  const H = await p.evaluate(() => document.documentElement.scrollHeight); const th = +tileH; let n = 0;
  for (let y = 0; y < H; y += th) { n++; await p.screenshot({ path: `shots/w${W}-${theme}${zoom ? '-z' + zoom : ''}-${String(n).padStart(2, '0')}.png`, fullPage: true, clip: { x: 0, y, width: +W, height: Math.min(th, H - y) } }); }
  console.log(W, theme, 'H', H, 'tiles', n); await b.close();
})();
