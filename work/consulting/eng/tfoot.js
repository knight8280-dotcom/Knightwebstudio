const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  for (let w = 320; w <= 372; w += 4) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80);
    const r = await p.evaluate(() => { const th = document.querySelector('.ledger tfoot th'), td = document.querySelector('.ledger tfoot td'); const rg = document.createRange(); rg.selectNodeContents(th); const a = rg.getBoundingClientRect(); rg.selectNodeContents(td); const c = rg.getBoundingClientRect(); return { gap: Math.round(c.left - a.right), thW: Math.round(th.getBoundingClientRect().width) }; });
    console.log(w, JSON.stringify(r)); }
  await b.close();
})();
