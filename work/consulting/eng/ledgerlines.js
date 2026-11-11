const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 980, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  for (const w of [760, 800, 900, 979, 980, 1000, 1040, 1099, 1100, 1160, 1280, 1440]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80);
    const r = await p.evaluate(() => { const lines = el => Math.round(el.getBoundingClientRect().height - 24) / 21; const rows = [...document.querySelectorAll('.ledger tbody tr')]; const sheet = document.querySelector('.sheet').getBoundingClientRect(); return { sheetW: Math.round(sheet.width), nameLines: rows.map(r => { const rg = document.createRange(); rg.selectNodeContents(r.children[0]); return rg.getClientRects().length; }), arithLines: rows.map(r => { const rg = document.createRange(); rg.selectNodeContents(r.children[1]); return rg.getClientRects().length; }), barColW: Math.round(rows[0].children[2].getBoundingClientRect().width), longestBar: Math.round(rows[1].children[2].firstElementChild.getBoundingClientRect().width), bigfigOrder: getComputedStyle(document.querySelector('.bigfig')).order, cols: getComputedStyle(document.querySelector('.week')).gridTemplateColumns }; });
    console.log(w, JSON.stringify(r)); }
  await b.close();
})();
