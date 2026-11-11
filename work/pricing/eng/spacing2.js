const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [1100, 1140, 1180, 1220]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const cells = [...document.querySelectorAll('.spec tbody .spec-price')].map(td => { const rg = document.createRange(); rg.selectNode(td.firstChild); const t = rg.getBoundingClientRect(); const c = td.getBoundingClientRect(); return Math.round(t.right - c.right); });
      const hd = document.querySelector('.header-inner'); let worst = 0, who = ''; for (const e of document.querySelectorAll('.site-header *, .topbar *')) { const rc = e.getBoundingClientRect(); if (rc.width && rc.right - innerWidth > worst) { worst = rc.right - innerWidth; who = e.className.toString().slice(0, 30); } }
      return { priceTextPastCellRightEdge: cells, headerPastViewport: Math.round(worst), who }; });
    console.log(w, JSON.stringify(r));
    if (w === 1100) { const y = await p.evaluate(() => document.querySelector('.spec').getBoundingClientRect().top + scrollY - 40); await p.screenshot({ path: `shots/spacing-1100.png`, fullPage: true, clip: { x: 0, y, width: w, height: 520 } }); await p.screenshot({ path: 'shots/spacing-1100-header.png', clip: { x: 0, y: 0, width: w, height: 130 } }); }
    await ctx.close();
  }
  await b.close();
})();
