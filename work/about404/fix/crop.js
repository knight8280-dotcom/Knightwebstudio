// node crop.js OUT path width theme selector name [scale] [pad]  -> crops the element's box (+pad) at device scale
const { chromium } = require('playwright');
(async () => {
  const [out, path, w, theme, sel, name, scale, pad] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: 900 }, deviceScaleFactor: +(scale || 2), colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(700);
  const r = await p.evaluate(s => { const q = document.querySelector(s).getBoundingClientRect(); return { x: q.x, y: q.y, width: q.width, height: q.height }; }, sel);
  const P = +(pad || 12);
  await p.screenshot({ path: `${out}/${name}.png`, clip: { x: Math.max(0, r.x - P), y: Math.max(0, r.y - P), width: Math.min(+w, r.width + 2 * P), height: r.height + 2 * P } });
  console.log(name, JSON.stringify(r));
  await b.close();
})();
