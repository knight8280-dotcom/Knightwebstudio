// Tries the recommended fixes as injected CSS in the browser only (nothing in the repository is changed).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const FIX = `
@media (max-width: 759.98px) {
  [data-page="consulting"] .ledger tfoot tr { grid-template-columns: auto minmax(0, 1fr); }
  [data-page="consulting"] .ledger tfoot .num { white-space: normal; text-align: right; }
}
@media (min-width: 980px) and (max-width: 1099.98px) { [data-page="consulting"] .week { grid-template-columns: minmax(0, 1fr); } [data-page="consulting"] .week > .bigfig { order: 0; } }
@media (min-width: 1100px) { [data-page="consulting"] .week { grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); } [data-page="consulting"] .ledger td:nth-child(2) { white-space: nowrap; } }
@media (max-width: 599.98px) { [data-page="consulting"] .path .more-link { justify-self: start; } }
`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 320, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: FIX });
  for (const w of [280, 320, 348, 360, 390, 600, 759, 760, 980, 1024, 1099, 1100, 1160, 1280, 1440]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(100);
    const r = await p.evaluate(() => { const th = document.querySelector('.ledger tfoot th'), td = document.querySelector('.ledger tfoot td'); const rg = document.createRange(); rg.selectNodeContents(th); const a = rg.getBoundingClientRect(); rg.selectNodeContents(td); const c = rg.getBoundingClientRect(); const rows = [...document.querySelectorAll('.ledger tbody tr')]; const lines = i => rows.map(r => { const g = document.createRange(); g.selectNodeContents(r.children[i]); return g.getClientRects().length; }); const sheet = document.querySelector('.sheet').getBoundingClientRect(); const lk = document.querySelector('.path .more-link').getBoundingClientRect(); return { totalGap: Math.round(c.left - a.right), totalLines: rg.getClientRects().length, sheetW: Math.round(sheet.width), sheetRight: Math.round(sheet.right), nameLines: lines(0).join(''), arithLines: lines(1).join(''), barCol: Math.round(rows[1].children[2].getBoundingClientRect().width), over: document.documentElement.scrollWidth - innerWidth, tableOverSheet: Math.round(document.querySelector('.ledger').getBoundingClientRect().right - (sheet.right - parseFloat(getComputedStyle(document.querySelector('.sheet')).paddingRight))), freeCheckLinkW: Math.round(lk.width) }; });
    console.log(w, JSON.stringify(r)); }
  await p.setViewportSize({ width: 320, height: 900 }); await p.waitForTimeout(100); await p.locator('.sheet').screenshot({ path: 'fix-sheet-320.png' });
  await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(100); await p.addStyleTag({ content: '.site-header{position:static!important}' }); await p.locator('.week').screenshot({ path: 'fix-week-1100.png' });
  await b.close();
})();
