const { chromium } = require('playwright'); const fs = require('fs');
const css = process.env.CSS ? fs.readFileSync(process.env.CSS) : null;
(async () => { const b = await chromium.launch();
  for (const [w,h] of [[320,256],[341,162]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  if (css) await ctx.route(/styles\.css/, r => r.fulfill({ body: css, contentType: 'text/css' }));
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  const [x, y] = await p.evaluate(() => { const r = document.getElementById('nav-toggle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.mouse.click(x, y); await p.waitForTimeout(500);
  console.log(w+'x'+h, await p.evaluate(() => [...document.querySelectorAll('#nav .nav-links a')].map(a => { const r = a.getBoundingClientRect(); const yy = r.top + r.height / 2; if (yy < 0 || yy > innerHeight) return null; const e = document.elementFromPoint(r.left + 30, yy); return a.textContent.trim() + '@' + Math.round(r.top) + '-' + Math.round(r.bottom) + ' -> ' + (e === a || a.contains(e) ? 'ok' : (e ? e.tagName + '.' + e.className : 'none')); }).filter(Boolean).join(' | ')));
  await p.screenshot({ path: `menu_${process.env.TAG}_${w}x${h}.png` }); await ctx.close(); }
  await b.close(); })();
