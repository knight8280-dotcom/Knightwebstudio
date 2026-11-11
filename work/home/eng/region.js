// node region.js WxH selector [theme] [pad] [name]  -> screenshot of a region (full page clip), animations settled
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [w, h] = process.argv[2].split('x').map(Number); const sel = process.argv[3]; const theme = process.argv[4] || 'light'; const pad = +(process.argv[5] || 16); const name = process.argv[6] || sel.replace(/[^a-z0-9]+/gi, '_');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => { for (const i of document.images) { i.loading = 'eager'; } await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
  await p.waitForTimeout(500);
  const r = await p.evaluate(s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; }, sel);
  const clip = { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(w, r.w + pad * 2), height: Math.min(r.h + pad * 2, 3000) };
  await p.screenshot({ path: `reg_${w}_${theme}_${name}.png`, fullPage: true, clip });
  console.log(`reg_${w}_${theme}_${name}.png`, JSON.stringify(clip));
  await b.close();
})();
