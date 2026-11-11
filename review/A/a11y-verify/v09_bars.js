const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' });
    await p.locator('table.ledger').scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
    console.log(w, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.ledger-bar')].map(td => { const s = td.querySelector('span'); const r = s.getBoundingClientRect(); const cs = getComputedStyle(s, '::before'); const a = getComputedStyle(s, '::after'); return { tdDisplay: getComputedStyle(td).display, tdW: Math.round(td.getBoundingClientRect().width), spanW: Math.round(r.width), spanH: Math.round(r.height), before: cs.content !== 'none' ? Math.round(parseFloat(cs.width)) + 'x' + cs.height : null, after: a.content !== 'none' ? a.width : null }; }).slice(0, 2))));
    await ctx.close();
  }
  await b.close();
})();
