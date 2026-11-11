// node snapw.js path width theme [fullpage] -> eng/snaps/<name>.png
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [path, w, theme, full, hh] = [process.argv[2], +process.argv[3], process.argv[4] || 'light', process.argv[5] === 'full', +(process.argv[6] || 900)];
  fs.mkdirSync('snaps', { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: w, height: hh }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
  // load lazy images
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 600) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(120); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
  const sel = process.argv[7];
  const out = `snaps/${path.replace(/\//g, '')}_${w}_${theme}${sel ? '_' + sel.replace(/[^a-z0-9]/gi, '') : ''}.png`;
  if (sel) await p.locator(sel).first().screenshot({ path: out }); else await p.screenshot({ path: out, fullPage: full });
  console.log(out); await b.close();
})();
