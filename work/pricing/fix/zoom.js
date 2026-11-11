// What leaves the viewport when only the text is enlarged (root font size), at 390px?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const pct of [130, 150, 200]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.addStyleTag({ content: `html{font-size:${pct}%}` + (process.argv[2] || '') });
    const r = await p.evaluate(() => { const vw = document.documentElement.clientWidth; const o = {}; for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.width && r.right > vw + 1 && !e.closest('.sr-only, .skip-link, .hp')) { const where = e.closest('main') ? 'main' : e.closest('.site-header') ? 'header' : e.closest('.topbar') ? 'topbar' : e.closest('.site-footer') ? 'footer' : e.closest('.mobile-cta') ? 'phonebar' : 'other'; o[where] = Math.max(o[where] || 0, Math.round(r.right - vw)); } } return o; });
    console.log(pct + '%', JSON.stringify(r));
    if (process.argv[3]) { await p.locator('.spec tbody').scrollIntoViewIfNeeded(); await p.screenshot({ path: `s/zoom${pct}.png` }); }
    await p.close();
  }
  await b.close();
})();
