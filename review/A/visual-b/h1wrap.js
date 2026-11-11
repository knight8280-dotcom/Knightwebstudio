const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|calendly\.com|hcaptcha|js\.stripe/, r => r.abort());
  await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'complete', payment_status: 'paid', mode: 'payment', plan: 'business-deposit', amount_total: 200000, currency: 'usd' }) }));
  const page = await ctx.newPage();
  await page.goto('http://localhost:8720/checkout/success/?plan=business-deposit&session_id=cs_test_abcdefghijklmnop'); await page.waitForTimeout(800);
  const res = {};
  for (let w = 320; w <= 1920; w += (w < 1000 ? 10 : 40)) {
    await page.setViewportSize({ width: w, height: 844 });
    const lines = await page.evaluate(() => { const el = document.querySelector('h1'); const range = document.createRange(); const n = el.firstChild; const out = []; const re = /\S+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const r = range.getClientRects()[0]; let L = out.find(l => Math.abs(l.top - r.top) < 6); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0]); } return out.map(l => l.w.join(' ')).join(' / '); });
    (res[lines] = res[lines] || []).push(w);
  }
  for (const [k, v] of Object.entries(res)) console.log(JSON.stringify(k), v[0] + '..' + v[v.length - 1], '(' + v.length + ' widths)');
  await browser.close();
})();
