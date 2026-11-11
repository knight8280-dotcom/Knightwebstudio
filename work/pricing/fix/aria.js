// The accessibility tree of the two tables as the browser exposes it (phone layout, where they are not display: table).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  const care = await p.locator('#care table').ariaSnapshot();
  console.log(care.split('\n').slice(0, 14).join('\n'));
  const spec = await p.locator('table.spec').ariaSnapshot();
  console.log(spec.split('\n').filter(l => /table|row "|link/.test(l)).slice(0, 16).join('\n'));
  // JavaScript off
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: w, height: 900 } });
    const q = await ctx.newPage();
    await q.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    const loc = q.locator('main *');
    const info = await q.locator('html').evaluate(() => { const inv = [...document.querySelectorAll('main *')].filter(e => { const cs = getComputedStyle(e); return e.getClientRects().length && (parseFloat(cs.opacity) < 1 || cs.visibility === 'hidden') && !e.closest('.sr-only'); }); return { invisible: inv.length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, height: document.documentElement.scrollHeight, deadButtons: [...document.querySelectorAll('button')].filter(e => e.offsetParent).length }; }).catch(e => String(e).slice(0, 200));
    console.log('no JavaScript', w, JSON.stringify(info));
    await q.screenshot({ path: `s/nojs-${w}.png` });
    await ctx.close();
  }
  await b.close();
})();
