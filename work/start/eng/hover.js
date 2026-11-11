const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/plausible|calendly/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  const probe = async (sel, props) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(900); const before = await el.evaluate((e, props) => props.map(k => getComputedStyle(e)[k]), props); await el.hover(); await p.waitForTimeout(500); const after = await el.evaluate((e, props) => props.map(k => getComputedStyle(e)[k]), props); await p.mouse.move(5, 5); const changed = props.filter((k, i) => before[i] !== after[i]); console.log(sel.padEnd(34), 'hover changes:', changed.length ? changed.map(k => k + ': ' + before[props.indexOf(k)].slice(0, 40) + ' -> ' + after[props.indexOf(k)].slice(0, 40)).join(' | ') : 'NOTHING'); };
  const P = ['transform', 'backgroundColor', 'color', 'boxShadow', 'borderTopColor', 'textDecorationLine', 'textDecorationColor'];
  for (const s of ['.page-head .btn-primary', '.page-head .btn-row a:last-child', 'a.price-strip', '.more-link', 'a.tier', '.board-foot p a', '.board-foot .btn', 'a.print', '.cta-band .btn-primary', '.cta-band .btn-row a:last-child', '.write a', '.footer-links a', '.brand', '#theme-toggle', '.header-book']) await probe(s, P);
  // print icon colour on hover
  const el = p.locator('a.print').first(); await el.hover(); await p.waitForTimeout(400); console.log('print .ico colour on hover:', await p.locator('a.print .ico').first().evaluate(e => getComputedStyle(e).color), ' print transform:', await el.evaluate(e => getComputedStyle(e).transform));
  // active state
  await p.locator('.page-head .btn-primary').hover(); await p.mouse.down(); await p.waitForTimeout(250); console.log('btn :active transform:', await p.locator('.page-head .btn-primary').evaluate(e => getComputedStyle(e).transform + ' shadow ' + getComputedStyle(e).boxShadow)); await p.mouse.move(5, 5); await p.mouse.up();
  await b.close();
})();
