// A11Y-09: the ledger's bar column in the accessibility tree, before and after hiding it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' });
    console.log('--- ' + w + ' as shipped');
    console.log(await p.locator('table.ledger').ariaSnapshot());
    const disp = await p.evaluate(() => { const t = document.querySelector('table.ledger'); return { table: getComputedStyle(t).display, tr: getComputedStyle(t.querySelector('tbody tr')).display, barCell: getComputedStyle(t.querySelector('.ledger-bar')).display, barW: Math.round(t.querySelector('.ledger-bar span').getBoundingClientRect().width), thVisible: t.querySelector('thead').getBoundingClientRect().height }; });
    console.log(JSON.stringify(disp));
    await p.evaluate(() => { const t = document.querySelector('table.ledger'); t.querySelectorAll('thead th')[2].setAttribute('aria-hidden', 'true'); t.querySelectorAll('td.ledger-bar').forEach(td => td.setAttribute('aria-hidden', 'true')); });
    console.log('--- ' + w + ' with aria-hidden on the th and td.ledger-bar');
    console.log(await p.locator('table.ledger').ariaSnapshot());
    await ctx.close();
  }
  await b.close();
})();
