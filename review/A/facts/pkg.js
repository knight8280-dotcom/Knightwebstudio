const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
  for (const v of ['advisor','audit','brand','bundle','business','care','check','commerce','gbp','onepage','partner','starter']) {
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/contact/?package=' + v, { waitUntil: 'load' });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const s = document.getElementById('package'); return s.value + ' | ' + s.selectedOptions[0].text; });
    console.log(v.padEnd(10), '=>', r, r.startsWith(v + ' ') ? 'OK' : 'MISMATCH');
    await p.close();
  }
  // checkout plan labels
  for (const v of ['starter-deposit','business-deposit','commerce-deposit','essential-care','growth-care','commerce-care']) {
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/checkout/?plan=' + v, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const e = document.getElementById('checkout-plan'); return (e.hidden ? '[hidden] ' : '') + e.innerText.replace(/\s+/g, ' '); });
    console.log(v.padEnd(18), '=>', r);
    await p.close();
  }
  await b.close();
})();
