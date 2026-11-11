const { chromium } = require('playwright');
const ranges = a => { const out = []; let s = a[0], p = a[0]; for (const x of a.slice(1)) { if (x - p > 10) { out.push(s + '-' + p); s = x; } p = x; } out.push(s + '-' + p); return out.join(', '); };
(async () => {
  const browser = await chromium.launch();
  const bodies = { paid: { status: 'complete', payment_status: 'paid', mode: 'payment', plan: 'business-deposit', amount_total: 200000, currency: 'usd' }, ach: { status: 'complete', payment_status: 'unpaid', mode: 'payment', plan: 'commerce-deposit', amount_total: 400000, currency: 'usd' } };
  for (const st of ['paid', 'ach']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/plausible\.io|calendly\.com|hcaptcha|js\.stripe/, r => r.abort());
    await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(bodies[st]) }));
    const page = await ctx.newPage(); await page.goto('http://localhost:8720/checkout/success/?plan=business-deposit&session_id=cs_test_abcdefghijklmnop'); await page.waitForTimeout(700);
    await page.addStyleTag({ content: '@media (max-width:599.98px){[data-page="checkout-success"]:not(:has(#success-retry:not([hidden]))) .page-head h1{font-size:calc(var(--fs-h1)*.76);text-wrap:pretty}}' });
    const res = {};
    for (let w = 320; w <= 600; w += 10) { await page.setViewportSize({ width: w, height: 844 }); const s = await page.evaluate(() => { const h = document.querySelector('h1'); const range = document.createRange(); const n = h.firstChild; const out = []; const re = /\S+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const r = range.getClientRects()[0]; let L = out.find(l => Math.abs(l.top - r.top) < 6); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0]); } return out.map(l => l.w.join(' ')).join(' / '); }); (res[s] = res[s] || []).push(w); }
    console.log(st, 'with fix:', Object.entries(res).map(([k, v]) => JSON.stringify(k) + ' @ ' + ranges(v)).join(' ; '));
    await ctx.close();
  }
  await browser.close();
})();
