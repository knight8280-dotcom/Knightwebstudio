const { chromium } = require('/opt/node-tools/node_modules/playwright');
// usage: node elshot.js width path selector outname [index]
(async () => {
  const [w, path, sel, name, idx] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +w < 700 ? 844 : 900 }, deviceScaleFactor: +w < 700 ? 2 : 1, reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
  // scroll through the page so reveals fire
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(60); }
  const loc = p.locator(sel).nth(+(idx || 0));
  await loc.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await loc.screenshot({ path: __dirname + '/shots/' + name + '.png' });
  await b.close();
})();
